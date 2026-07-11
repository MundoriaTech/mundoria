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
  const { data: possibleNoShows } = await admin
    .from("bookings")
    .select("id,scheduled_date,scheduled_start_time")
    .eq("scheduled_date", date)
    .in("status", ["matched", "confirmed", "cleaner_en_route"])
    .eq("checkin_verified", false);
  const overdue = (possibleNoShows ?? []).filter(
    (booking) =>
      new Date(
        `${booking.scheduled_date}T${booking.scheduled_start_time}`,
      ).getTime() +
        30 * 60 * 1000 <=
      now.getTime(),
  );
  const handled = [];
  for (const booking of overdue) {
    handled.push({ id: booking.id, result: await handleNoShow(booking.id) });
  }
  const { data: expired } = await admin
    .from("bookings")
    .select("id")
    .in("status", ["no_show", "pending_match"])
    .not("replacement_deadline", "is", null)
    .lte("replacement_deadline", now.toISOString());
  const cancelled = [];
  for (const booking of expired ?? []) {
    if (await cancelExpiredReplacement(booking.id)) cancelled.push(booking.id);
  }
  return NextResponse.json({ cancelled, handled });
}
