import { NO_CLEANER_REASON } from "@/lib/bookings/no-cleaner";
import { closeEmergencyList } from "@/lib/matching/emergency-list";
import { bookingServiceName } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
  sendSMS,
} from "@/lib/notifications/send";
import { bookingStartUtc, PAYMENT_TIME_ZONE } from "@/lib/payments/uk-schedule";
import { refundBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";
import { isAutoCancelProtected } from "@/lib/bookings/auto-cancel-test";

/**
 * If no cleaner has accepted by the cutoff, the visit is cancelled at no
 * charge and the customer is told, so nobody finds out on the day.
 * Cutoff: 24 hours before the visit. If the booking was made (or moved) to
 * less than 24 hours away, 2 hours before the visit instead.
 */
export const MATCH_CUTOFF_HOURS = 24;
export const SHORT_NOTICE_CUTOFF_HOURS = 2;
/** Admins are warned this long before the cutoff, once. */
export const ADMIN_WARNING_HOURS = 6;
export { NO_CLEANER_REASON };

const HOUR = 60 * 60 * 1000;
const UNACCEPTED = ["pending_match", "matched"];

export function matchCutoffAt(booking: {
  created_at?: string | null;
  payment_status?: string | null;
  previous_cleaner_id?: string | null;
  schedule_changed_at?: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
}) {
  const start = bookingStartUtc(
    booking.scheduled_date,
    String(booking.scheduled_start_time).slice(0, 5),
  );
  if (!start) return null;
  const short = new Date(start.getTime() - SHORT_NOTICE_CUTOFF_HOURS * HOUR);
  // A replacement (the confirmed cleaner dropped out or missed a
  // confirmation gate inside the last 24h) keeps looking until 2h before.
  if (booking.previous_cleaner_id || booking.payment_status === "held") {
    return short;
  }
  const standard = new Date(start.getTime() - MATCH_CUTOFF_HOURS * HOUR);
  // Booked, or last moved, less than 24 hours before the visit.
  const lastSet = Math.max(
    booking.created_at ? new Date(booking.created_at).getTime() : 0,
    booking.schedule_changed_at ? new Date(booking.schedule_changed_at).getTime() : 0,
  );
  if (lastSet > standard.getTime()) return short;
  return standard;
}

export function formatCutoff(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: PAYMENT_TIME_ZONE,
    weekday: "long",
  });
}

type Row = {
  address: { postcode?: string | null } | { postcode?: string | null }[] | null;
  created_at: string;
  customer:
    | { email?: string | null; full_name?: string | null; notification_preferences?: { email?: boolean; sms?: boolean } | null; phone?: string | null }
    | { email?: string | null; full_name?: string | null; notification_preferences?: { email?: boolean; sms?: boolean } | null; phone?: string | null }[]
    | null;
  customer_id: string;
  id: string;
  payment_status: string;
  previous_cleaner_id: string | null;
  schedule_changed_at: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  service_type: ServiceType;
  status: string;
  stripe_payment_intent_id: string | null;
};

/** Warn admins before the cutoff, then cancel and tell the customer at it. */
export async function enforceMatchCutoffs(now: Date = new Date()) {
  const admin = createAdminClient();
  // Any visit whose cutoff (+ warning) can fall before "now" starts within
  // the next 24h + 6h; one extra day covers time zones.
  const horizon = new Date(
    now.getTime() + (MATCH_CUTOFF_HOURS + ADMIN_WARNING_HOURS + 24) * HOUR,
  )
    .toISOString()
    .slice(0, 10);
  const { data } = await admin
    .from("bookings")
    .select(
      "id,customer_id,status,payment_status,previous_cleaner_id,stripe_payment_intent_id,service_type,is_recurring,scheduled_date,scheduled_start_time,created_at,schedule_changed_at,address:addresses(postcode),customer:profiles!bookings_customer_id_fkey(email,full_name,phone,notification_preferences)",
    )
    .in("status", UNACCEPTED)
    .lte("scheduled_date", horizon)
    .eq("auto_cancel_exempt", false)
    .limit(200);

  let warned = 0;
  let cancelled = 0;
  for (const booking of (data ?? []) as Row[]) {
    if (isAutoCancelProtected(booking)) continue;
    const cutoff = matchCutoffAt(booking);
    const start = bookingStartUtc(
      booking.scheduled_date,
      String(booking.scheduled_start_time).slice(0, 5),
    );
    if (!cutoff || !start || start.getTime() <= now.getTime()) continue;

    if (now.getTime() >= cutoff.getTime()) {
      if (await cancelForNoCleaner(booking, now)) cancelled += 1;
      continue;
    }
    if (now.getTime() >= cutoff.getTime() - ADMIN_WARNING_HOURS * HOUR) {
      if (await warnAdminsOnce(booking, cutoff)) warned += 1;
    }
  }
  return { cancelled, warned };
}

async function warnAdminsOnce(booking: Row, cutoff: Date) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("matching_decisions")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id)
    .eq("decision", "cutoff_warning");
  if (count) return false;
  await admin.from("matching_decisions").insert({
    booking_id: booking.id,
    cleaner_id: null,
    decision: "cutoff_warning",
    reasons: { cutoff_at: cutoff.toISOString() },
  });
  await alertAdmins(
    "matching_cutoff_warning",
    "A booking still has no cleaner",
    `No cleaner has accepted this ${bookingServiceName(booking)} visit. It will be cancelled at no charge on ${formatCutoff(cutoff)} unless someone is assigned.`,
    {
      booking_id: booking.id,
      bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/booking/${booking.id}`,
      postcode: one(booking.address)?.postcode,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_start_time,
      serviceName: bookingServiceName(booking),
    },
  );
  return true;
}

async function cancelForNoCleaner(booking: Row, now: Date) {
  const admin = createAdminClient();
  const nowIso = now.toISOString();
  const { data: updated } = await admin
    .from("bookings")
    .update({
      cancellation_reason: NO_CLEANER_REASON,
      cancelled_at: nowIso,
      cleaner_id: null,
      status: "cancelled",
    })
    .eq("id", booking.id)
    .in("status", UNACCEPTED)
    .select("id")
    .maybeSingle();
  if (!updated) return false;

  if (booking.payment_status === "held" && booking.stripe_payment_intent_id) {
    try {
      await refundBookingPayment(booking.id);
    } catch {
      // Booking is already cancelled; admins see the payment on the booking.
    }
  }
  await admin
    .from("cleaner_job_responses")
    .update({ responded_at: nowIso })
    .eq("booking_id", booking.id)
    .is("responded_at", null);
  await closeEmergencyList(booking.id).catch(() => undefined);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const rebookUrl = `${appUrl}/booking/new?rebook=${booking.id}`;
  const serviceName = bookingServiceName(booking);
  const when = `${new Date(`${booking.scheduled_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", weekday: "long" })} at ${String(booking.scheduled_start_time).slice(0, 5)}`;
  const customer = one(booking.customer);
  const prefs = customer?.notification_preferences ?? {};
  const line = `We're sorry, no cleaner was available for your ${serviceName.toLowerCase()} on ${when}, so we've cancelled it. You have not been charged.`;

  await Promise.all([
    createInAppNotification(
      booking.customer_id,
      "booking_cancelled",
      "No cleaner available",
      `${line} Pick another time and we'll find you a cleaner.`,
      { booking_id: booking.id },
    ).catch(() => undefined),
    sendPushNotification(
      booking.customer_id,
      "No cleaner available",
      line,
      { booking_id: booking.id },
    ).catch(() => undefined),
    customer?.email && prefs.email !== false
      ? sendBrandedEmail({
          data: {
            appUrl,
            bookingId: booking.id,
            bookingUrl: rebookUrl,
            firstName: customer.full_name?.split(" ")[0],
            fullName: customer.full_name,
            scheduledDate: booking.scheduled_date,
            scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
            serviceName,
          },
          template: "customer.no_cleaner_found",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    customer?.phone && prefs.sms !== false
      ? sendSMS(
          customer.phone,
          `Mundoria: ${line} Book another time: ${rebookUrl}`,
        ).catch(() => undefined)
      : null,
    alertAdmins(
      "matching_cutoff_cancelled",
      "Booking cancelled: no cleaner accepted",
      `No cleaner accepted this ${serviceName} visit by the cutoff, so it was cancelled at no charge and the customer was told.`,
      {
        booking_id: booking.id,
        bookingUrl: `${appUrl}/admin/booking/${booking.id}`,
        postcode: one(booking.address)?.postcode,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_start_time,
        serviceName,
      },
    ).catch(() => undefined),
  ]);
  return true;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}
