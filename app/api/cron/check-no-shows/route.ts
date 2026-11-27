import { bookingStartUtc } from "@/lib/payments/uk-schedule";
import { NextResponse } from "next/server";

import { cancelExpiredReplacement } from "@/lib/bookings/no-show";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { alertAdmins } from "@/lib/notifications/admin";
import { notifyCleanerDayOf } from "@/lib/notifications/cleaner-day-of";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  // Only accepted visits (a cleaner who was merely offered the job can't
  // no-show), and only when the cleaner never arrived: "arrived but the
  // clean hasn't started" (customer slow to open the door, or not home) is
  // not a no-show. Dates span yesterday..today so late-evening UK visits
  // aren't missed around midnight UTC.
  const { data: possibleNoShows } = await admin
    .from("bookings")
    .select("id,scheduled_date,scheduled_start_time")
    .gte("scheduled_date", new Date(now.getTime() - 864e5).toISOString().slice(0, 10))
    .lte("scheduled_date", date)
    .in("status", ["confirmed", "cleaner_en_route"])
    .is("arrived_at", null)
    .eq("checkin_verified", false);
  const overdue = (possibleNoShows ?? []).filter((booking) => {
    const start = bookingStartUtc(
      booking.scheduled_date,
      String(booking.scheduled_start_time).slice(0, 5),
    );
    return Boolean(start) && start!.getTime() + 30 * 60 * 1000 <= now.getTime();
  });
  // A late cleaner is no longer removed automatically: they stay on the job,
  // admins get one urgent alert to call them, and the cleaner is reminded to
  // check in. Admins mark a real no-show by hand (Mark as no-show), which
  // starts replacement matching.
  const handled = [];
  for (const booking of overdue) {
    try {
      handled.push({ id: booking.id, result: await alertLateCleaner(admin, booking.id) });
    } catch (error) {
      handled.push({
        error: error instanceof Error ? error.message : "No-show alert failed",
        id: booking.id,
      });
    }
  }
  const { data: expired } = await admin
    .from("bookings")
    .select("id")
    .in("status", ["no_show", "pending_match"])
    .not("replacement_deadline", "is", null)
    .lte("replacement_deadline", now.toISOString());
  const cancelled = [];
  for (const booking of expired ?? []) {
    try {
      if (await cancelExpiredReplacement(booking.id)) cancelled.push(booking.id);
    } catch {
      // One bad booking must not stop the rest; it is retried next run.
    }
  }
  return NextResponse.json({ cancelled, handled });
}

/** Alert admins once that the cleaner hasn't checked in; the cleaner stays assigned. */
async function alertLateCleaner(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data: sent } = await admin
    .from("matching_decisions")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("decision", "late_checkin_alert")
    .limit(1);
  if (sent?.length) return { alerted: false };

  const { data: booking } = await admin
    .from("bookings")
    .select("cleaner_id,status,scheduled_date,scheduled_start_time,cleaner:profiles!bookings_cleaner_id_fkey(full_name,phone)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { alerted: false };
  const cleaner = (Array.isArray(booking.cleaner) ? booking.cleaner[0] : booking.cleaner) as
    | { full_name?: string | null; phone?: string | null }
    | null;
  const when = `${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)}`;
  const onTheWay = booking.status === "cleaner_en_route";

  await alertAdmins(
    "cleaner_late_checkin",
    "Cleaner hasn't checked in",
    `${cleaner?.full_name ?? "The cleaner"} hasn't checked in for the visit on ${when}, 30 minutes after the start${onTheWay ? " (they said they're on the way)" : ""}. They're still assigned. Call them${cleaner?.phone ? ` on ${cleaner.phone}` : ""}; if they can't come, use Mark as no-show on the booking to find a replacement.`,
    { booking_id: bookingId, cleaner_id: booking.cleaner_id },
  );
  if (booking.cleaner_id) {
    await notifyCleanerDayOf({
      body: `Your visit started at ${String(booking.scheduled_start_time).slice(0, 5)}. Tap "I have arrived" when you get there, or message Mundoria if you're delayed.`,
      bookingId,
      cleanerId: booking.cleaner_id,
      title: "Please check in",
    });
  }
  await admin.from("matching_decisions").insert({
    booking_id: bookingId,
    cleaner_id: booking.cleaner_id,
    decision: "late_checkin_alert",
    reasons: { status: booking.status },
  });
  return { alerted: true };
}
