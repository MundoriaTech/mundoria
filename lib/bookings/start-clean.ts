import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const GRACE_MS = 5 * 60 * 1000;
const PENALTY_PENCE_PER_MINUTE = 50;

export function accessPenaltyPence(graceEndsAt: string | null, confirmedAt: Date) {
  if (!graceEndsAt) return 0;
  const lateMs = confirmedAt.getTime() - new Date(graceEndsAt).getTime();
  if (lateMs <= 0) return 0;
  return Math.ceil(lateMs / 60_000) * PENALTY_PENCE_PER_MINUTE;
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
  if (!booking.arrived_at) {
    throw new Error("The clean can start after the cleaner has arrived.");
  }
  if (booking.status === "in_progress") return { started: true };

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

  if (cleanerConfirmed && customerConfirmed) {
    const penalty = accessPenaltyPence(booking.access_grace_ends_at, now);
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
      penalty > 0
        ? `You both confirmed the start. A waiting charge of £${(penalty / 100).toFixed(2)} applies after the 5-minute grace.`
        : "You both confirmed, so the clean has started.",
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
      role === "cleaner"
        ? "Your cleaner is ready to start. Confirm when you have let them in."
        : "The customer has confirmed. Tap Start cleaning if you have not already.",
      { booking_id: bookingId },
    );
  }
  return { penaltyPence: 0, started: false };
}

export { GRACE_MS };
