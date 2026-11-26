import { loadServicePricing } from "@/lib/customer/pricing-config";
import { hourlyRatePence } from "@/lib/customer/rate-card";
import { addOnAmountPence, formatMoney, SERVICE_ADD_ONS } from "@/lib/customer/services";
import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
  sendSMS,
} from "@/lib/notifications/send";
import { extraTimeCleanerPence } from "@/lib/payments/cleaner-pay";
import { addPayoutAmount, chargeIdOf, chargeSavedCard } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CleaningStandard, ServiceType } from "@/types/customer";

/** Extra time a cleaner can ask for on the day. */
export const EXTRA_TIME_OPTIONS = [30, 60, 90] as const;

export type ExtraTimeRow = {
  amount_pence: number;
  created_at: string;
  decided_at: string | null;
  id: string;
  minutes: number;
  reason: string | null;
  status: "pending" | "approved" | "declined" | "charged" | "failed" | "cancelled";
};

/** Visits still under way (or just finished, not yet charged). */
const OPEN_VISIT = ["in_progress", "awaiting_customer_confirmation"];

function minutesLabel(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes} minutes`;
}

/**
 * Price of extra time at this booking's own rate: the service's hourly
 * labour rate plus the hourly product/equipment rate if they were booked.
 */
export async function extraTimePricePence(bookingId: string, minutes: number) {
  const admin = createAdminClient();
  const [{ data: booking }, { data: addOns }, pricing] = await Promise.all([
    admin
      .from("bookings")
      .select("service_type,cleaning_standard")
      .eq("id", bookingId)
      .single(),
    admin.from("booking_add_ons").select("add_on_id").eq("booking_id", bookingId),
    loadServicePricing(),
  ]);
  if (!booking) throw new Error("Booking not found.");
  const serviceType = booking.service_type as ServiceType;
  const standard = (booking.cleaning_standard ?? "enhanced") as CleaningStandard;
  let perHour = hourlyRatePence(serviceType, standard, pricing);
  for (const row of addOns ?? []) {
    const def = SERVICE_ADD_ONS.find((item) => item.id === row.add_on_id);
    if (def?.hourly) {
      perHour += addOnAmountPence(def, { durationHours: 1, pricing, serviceType, standard });
    }
  }
  return Math.round((perHour * minutes) / 60);
}

/** Cleaner asks for more time while the clean is under way. */
export async function requestExtraTime({
  bookingId,
  cleanerId,
  minutes,
  reason,
}: {
  bookingId: string;
  cleanerId: string;
  minutes: number;
  reason?: string | null;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,status,customer_id,cleaner_id,customer:profiles!bookings_customer_id_fkey(phone,notification_preferences)")
    .eq("id", bookingId)
    .eq("cleaner_id", cleanerId)
    .maybeSingle();
  if (!booking) throw new Error("Job not found.");
  if (booking.status !== "in_progress") {
    throw new Error("You can ask for more time while the clean is in progress.");
  }
  const { count } = await admin
    .from("booking_time_extensions")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("status", "pending");
  if (count) throw new Error("You already have a request waiting for the customer.");

  const amount = await extraTimePricePence(bookingId, minutes);
  const { data: row, error } = await admin
    .from("booking_time_extensions")
    .insert({
      amount_pence: amount,
      booking_id: bookingId,
      cleaner_id: cleanerId,
      minutes,
      reason: reason?.trim() || null,
      requested_by: cleanerId,
    })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Couldn't send the request.");

  const line = `Your cleaner asked for ${minutesLabel(minutes)} more (${formatMoney(amount)}).${reason?.trim() ? ` Reason: ${reason.trim()}` : ""} Approve or decline on your booking page.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const customer = (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) as
    | { notification_preferences?: { sms?: boolean } | null; phone?: string | null }
    | null;
  await Promise.all([
    createInAppNotification(booking.customer_id as string, "extra_time_request", "More time requested", line, {
      booking_id: bookingId,
    }).catch(() => undefined),
    sendPushNotification(booking.customer_id as string, "More time requested", line, { booking_id: bookingId }).catch(
      () => undefined,
    ),
    customer?.phone && customer.notification_preferences?.sms !== false
      ? sendSMS(customer.phone, `Mundoria: ${line} ${appUrl}/booking/${bookingId}`).catch(() => undefined)
      : null,
  ]);
  return { amount, id: row.id as string };
}

/** Customer approves or declines a pending request. */
export async function decideExtraTime({
  bookingId,
  customerId,
  decision,
  extensionId,
}: {
  bookingId: string;
  customerId: string;
  decision: "approved" | "declined";
  extensionId: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,status,customer_id,cleaner_id,estimated_duration_hours,payment_status")
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (!booking) throw new Error("Booking not found.");
  if (!OPEN_VISIT.includes(booking.status as string)) {
    throw new Error("This visit can't take more time now.");
  }
  const { data: updated } = await admin
    .from("booking_time_extensions")
    .update({ decided_at: new Date().toISOString(), decided_by: customerId, status: decision })
    .eq("id", extensionId)
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .select("id,minutes,amount_pence")
    .maybeSingle();
  if (!updated) throw new Error("That request was already answered.");

  if (decision === "approved") {
    await admin
      .from("bookings")
      .update({
        estimated_duration_hours:
          Number(booking.estimated_duration_hours ?? 0) + Number(updated.minutes) / 60,
      })
      .eq("id", bookingId);
    // Already charged for the visit (rare: approved after next-day capture).
    if (booking.payment_status === "released") await chargeApprovedExtraTime(bookingId);
  }
  if (booking.cleaner_id) {
    await sendPushNotification(
      booking.cleaner_id as string,
      decision === "approved" ? "Extra time approved" : "Extra time declined",
      decision === "approved"
        ? `The customer approved ${minutesLabel(Number(updated.minutes))} more. You'll be paid for it.`
        : "The customer declined the extra time. Please finish within the booked time.",
      { booking_id: bookingId },
    ).catch(() => undefined);
  }
  return updated;
}

/** Admin records extra time the customer agreed to (e.g. by phone). */
export async function adminAddExtraTime({
  adminId,
  bookingId,
  minutes,
  note,
}: {
  adminId: string;
  bookingId: string;
  minutes: number;
  note: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,status,cleaner_id,estimated_duration_hours,payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) throw new Error("Booking not found.");
  if (!["in_progress", "awaiting_customer_confirmation", "completed"].includes(booking.status as string)) {
    throw new Error("Extra time can only be added once the clean has started.");
  }
  const amount = await extraTimePricePence(bookingId, minutes);
  const { error } = await admin.from("booking_time_extensions").insert({
    admin_note: note,
    amount_pence: amount,
    booking_id: bookingId,
    cleaner_id: booking.cleaner_id,
    decided_at: new Date().toISOString(),
    decided_by: adminId,
    minutes,
    requested_by: adminId,
    status: "approved",
  });
  if (error) throw new Error(error.message);
  await admin
    .from("bookings")
    .update({ estimated_duration_hours: Number(booking.estimated_duration_hours ?? 0) + minutes / 60 })
    .eq("id", bookingId);
  // After the visit was charged, charge the extra time straight away.
  if (booking.payment_status === "released") await chargeApprovedExtraTime(bookingId);
  return { amount };
}

/**
 * Charge every approved, uncharged extension on a booking as one payment
 * and add the cleaner's share (less the booking's commission) to their
 * payout. Called after the main capture, or straight away when time is
 * approved after the visit was already charged.
 */
export async function chargeApprovedExtraTime(bookingId: string) {
  const admin = createAdminClient();
  const [{ data: rows }, { data: booking }] = await Promise.all([
    admin
      .from("booking_time_extensions")
      .select("id,amount_pence,minutes")
      .eq("booking_id", bookingId)
      .eq("status", "approved"),
    admin
      .from("bookings")
      .select("customer_id,cleaner_id,stripe_payment_method_id")
      .eq("id", bookingId)
      .single(),
  ]);
  const pending = rows ?? [];
  const total = pending.reduce((sum, row) => sum + Number(row.amount_pence ?? 0), 0);
  if (!booking || total <= 0) return { chargedPence: 0 };
  const ids = pending.map((row) => row.id as string);
  try {
    const intent = await chargeSavedCard({
      amount: total,
      bookingId,
      customerId: booking.customer_id as string,
      kind: "extra_time",
      paymentMethodId: booking.stripe_payment_method_id as string | null,
    });
    await admin
      .from("booking_time_extensions")
      .update({
        charged_at: new Date().toISOString(),
        status: "charged",
        stripe_payment_intent_id: intent.id,
      })
      .in("id", ids);
    if (booking.cleaner_id) {
      const minutes = pending.reduce((sum, row) => sum + Number(row.minutes ?? 0), 0);
      await addPayoutAmount({
        bookingId,
        chargeId: chargeIdOf(intent),
        cleanerId: booking.cleaner_id as string,
        grossPence: total,
        kind: "extra_time",
        // The cleaner earns £13 an hour for the extra time, not a share of the charge.
        netPence: extraTimeCleanerPence(minutes),
      });
    }
    return { chargedPence: total };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Charge failed";
    await admin
      .from("booking_time_extensions")
      .update({ failure_reason: reason, status: "failed" })
      .in("id", ids);
    await alertAdmins(
      "payment_failed",
      "Extra cleaning time could not be charged",
      `Approved extra time of ${formatMoney(total)} couldn't be charged to the customer's card. ${reason}`,
      { booking_id: bookingId },
    ).catch(() => undefined);
    return { chargedPence: 0 };
  }
}

export function extraTimeStatusLabel(status: ExtraTimeRow["status"]) {
  switch (status) {
    case "pending":
      return "Waiting for the customer";
    case "approved":
      return "Approved, charged after the clean";
    case "charged":
      return "Approved and charged";
    case "declined":
      return "Declined";
    case "failed":
      return "Approved, charge failed";
    default:
      return "Cancelled";
  }
}

export { minutesLabel as extraTimeLabel };
