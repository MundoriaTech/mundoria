import { assertNoSafetyHold } from "@/lib/bookings/safety-alert";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const GRACE_MS = 5 * 60 * 1000;
const PENALTY_PENCE_PER_MINUTE = 50;

/** The waiting charge is capped at 30 minutes (£15). */
const PENALTY_MAX_MINUTES = 30;

export function accessPenaltyPence(graceEndsAt: string | null, confirmedAt: Date) {
  if (!graceEndsAt) return 0;
  const lateMs = confirmedAt.getTime() - new Date(graceEndsAt).getTime();
  if (lateMs <= 0) return 0;
  const minutes = Math.min(PENALTY_MAX_MINUTES, Math.ceil(lateMs / 60_000));
  return minutes * PENALTY_PENCE_PER_MINUTE;
}

export async function confirmCleanStart({
  bookingId,
  role,
  userId,
}: {
  bookingId: string;
  role: "cleaner" | "customer";
  userId: string;
}) {
  const admin = createAdminClient();
  const column = role === "cleaner" ? "cleaner_id" : "customer_id";
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,status,arrived_at,cleaner_start_confirmed_at,customer_start_confirmed_at,access_grace_ends_at,customer_id,cleaner_id",
    )
    .eq("id", bookingId)
    .eq(column, userId)
    .single();
  if (!booking) throw new Error("Booking not found.");
  await assertNoSafetyHold(bookingId);
  if (!booking.arrived_at) {
    throw new Error("The clean can start after the cleaner has arrived.");
  }
  if (booking.status === "in_progress") return { started: true };
  if (!["confirmed", "cleaner_en_route"].includes(booking.status)) {
    throw new Error(`The clean can't start while this booking is ${booking.status}.`);
  }

  const now = new Date();
  const patch =
    role === "cleaner"
      ? { cleaner_start_confirmed_at: now.toISOString() }
      : { customer_start_confirmed_at: now.toISOString() };
  const cleanerConfirmed =
    role === "cleaner" ? now.toISOString() : booking.cleaner_start_confirmed_at;
  const customerConfirmed =
    role === "customer"
      ? now.toISOString()
      : booking.customer_start_confirmed_at;

  // The cleaner can start alone once they've arrived (the customer may not
  // be home: key safe, Airbnb, office). The customer's tap is optional.
  if (cleanerConfirmed) {
    // Waiting charges are switched off: the cleaner reports a wait with
    // "Customer not answering" instead, and nothing is charged.
    const penalty = 0;
    await admin
      .from("bookings")
      .update({
        ...patch,
        access_penalty_pence: penalty,
        actual_start_time: now.toISOString(),
        checkin_verified: true,
        status: "in_progress",
      })
      .eq("id", bookingId);
    await sendPushNotification(
      booking.customer_id,
      "Cleaning has started",
      customerConfirmed
          ? "You both confirmed, so the clean has started."
          : "Your cleaner has started the clean.",
      { booking_id: bookingId },
    );
    return { penaltyPence: penalty, started: true };
  }

  await admin.from("bookings").update(patch).eq("id", bookingId);
  const otherId = role === "cleaner" ? booking.customer_id : booking.cleaner_id;
  if (otherId) {
    await sendPushNotification(
      otherId,
      "Confirm the clean can start",
      "The customer has confirmed. Tap Start cleaning when you're ready.",
      { booking_id: bookingId },
    );
  }
  return { penaltyPence: 0, started: false };
}

export { GRACE_MS };
