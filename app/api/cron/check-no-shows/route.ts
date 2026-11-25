import { bookingStartUtc } from "@/lib/payments/uk-schedule";
import { NextResponse } from "next/server";

import {
  cancelExpiredReplacement,
  handleNoShow,
} from "@/lib/bookings/no-show";
import { isAuthorizedCron } from "@/lib/cron/auth";
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
  const handled = [];
  for (const booking of overdue) {
    try {
      handled.push({ id: booking.id, result: await handleNoShow(booking.id) });
    } catch (error) {
      handled.push({
        error: error instanceof Error ? error.message : "No-show handling failed",
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
