import { refundBookingPayment } from "@/lib/payments/service";
import { runMatchingEngine } from "@/lib/matching/engine";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

const OPEN_STATUSES = [
  "pending_match",
  "matched",
  "confirmed",
  "cleaner_en_route",
];

export async function seriesRootId(admin: Admin, booking: {
  id: string;
  parent_booking_id?: string | null;
}) {
  return booking.parent_booking_id ?? booking.id;
}

export async function pauseRegularClean({
  bookingId,
  customerId,
  endsOn,
  startsOn,
}: {
  bookingId: string;
  customerId: string;
  endsOn: string;
  startsOn: string;
}) {
  if (endsOn < startsOn) {
    throw new Error("The pause end date has to be on or after the start date.");
  }
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,parent_booking_id,is_recurring,customer_id")
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .single();
  if (!booking?.is_recurring) {
    throw new Error("Only a regular clean can be paused.");
  }
  const rootId = await seriesRootId(admin, booking);
  const { error } = await admin
    .from("bookings")
    .update({ pause_ends_on: endsOn, pause_starts_on: startsOn })
    .eq("id", rootId);
  if (error) throw new Error(error.message);

  const { data: visits } = await admin
    .from("bookings")
    .select("id,payment_status,stripe_payment_intent_id,status")
    .or(`id.eq.${rootId},parent_booking_id.eq.${rootId}`)
    .gte("scheduled_date", startsOn)
    .lte("scheduled_date", endsOn)
    .in("status", OPEN_STATUSES);

  for (const visit of visits ?? []) {
    if (visit.stripe_payment_intent_id && visit.payment_status === "held") {
      try {
        await refundBookingPayment(visit.id);
      } catch {
        // The visit is still skipped if the refund needs a manual follow-up.
      }
    }
    await admin
      .from("bookings")
      .update({
        cancellation_reason: "Holiday pause",
        cancelled_at: new Date().toISOString(),
        cancelled_by: customerId,
        payment_status:
          visit.payment_status === "held" ? "refunded" : visit.payment_status,
        status: "cancelled",
      })
      .eq("id", visit.id);
  }

  return { paused: (visits ?? []).length };
}

export async function changePro({
  bookingId,
  customerId,
}: {
  bookingId: string;
  customerId: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .single();
  if (!booking) throw new Error("Booking not found.");
  if (!OPEN_STATUSES.includes(booking.status) && booking.status !== "matched") {
    throw new Error("This visit can no longer change pro.");
  }
  if (booking.is_recurring && !booking.parent_booking_id) {
    throw new Error("Change pro is available from the second visit onward.");
  }

  const previousCleanerId = booking.cleaner_id as string | null;
  if (booking.is_recurring) {
    const rootId = booking.parent_booking_id as string;
    const { data: rest } = await admin
      .from("bookings")
      .select("id")
      .eq("parent_booking_id", rootId)
      .neq("id", booking.id)
      .gte("scheduled_date", booking.scheduled_date)
      .in("status", OPEN_STATUSES);
    if (rest?.length) {
      await admin
        .from("bookings")
        .update({
          cancellation_reason: "Change pro",
          cancelled_at: new Date().toISOString(),
          cancelled_by: customerId,
          status: "cancelled",
        })
        .in(
          "id",
          rest.map((row) => row.id),
        );
    }
  }

  const { error } = await admin
    .from("bookings")
    .update({
      cleaner_id: null,
      previous_cleaner_id: previousCleanerId,
      preferred_cleaner_id: null,
      status: "pending_match",
    })
    .eq("id", booking.id);
  if (error) throw new Error(error.message);

  await runMatchingEngine(booking.id, {
    excludeCleanerIds: previousCleanerId ? [previousCleanerId] : [],
  });
  return { success: true };
}

export async function cancelSeriesVisits({
  bookingId,
  customerId,
  reason,
}: {
  bookingId: string;
  customerId: string;
  reason: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,parent_booking_id,scheduled_date,is_recurring")
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .single();
  if (!booking) throw new Error("Booking not found.");
  const rootId = booking.parent_booking_id ?? booking.id;
  const { data: visits } = await admin
    .from("bookings")
    .select("id")
    .or(`id.eq.${rootId},parent_booking_id.eq.${rootId}`)
    .gte("scheduled_date", booking.scheduled_date)
    .in("status", OPEN_STATUSES);
  const ids = (visits ?? []).map((visit) => visit.id);
  if (!ids.length) {
    throw new Error("There are no upcoming visits left to cancel.");
  }
  const { data: payable } = await admin
    .from("bookings")
    .select("id,payment_status,stripe_payment_intent_id")
    .in("id", ids);
  for (const visit of payable ?? []) {
    if (visit.stripe_payment_intent_id && visit.payment_status === "held") {
      try {
        await refundBookingPayment(visit.id);
      } catch {
        // The visit is still cancelled if the refund needs a manual follow-up.
      }
    }
  }
  const { error } = await admin
    .from("bookings")
    .update({
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: customerId,
      status: "cancelled",
    })
    .in("id", ids);
  if (error) throw new Error(error.message);
  return { cancelled: ids.length };
}
