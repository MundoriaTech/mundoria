import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { activateEmergencyList } from "@/lib/matching/emergency-list";
import { createAdminClient } from "@/lib/supabase/admin";

/** Expire unanswered job offers and cascade to the Emergency List. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: expired } = await admin
    .from("cleaner_job_responses")
    .select("booking_id,cleaner_id,bookings!inner(id,cleaner_id,status)")
    .eq("response", "expired")
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .is("responded_at", null);

  const cascaded: string[] = [];
  const seen = new Set<string>();

  for (const row of expired ?? []) {
    const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    if (!booking) continue;
    if (
      booking.cleaner_id !== row.cleaner_id ||
      !["matched", "pending_match"].includes(booking.status)
    ) {
      continue;
    }
    if (seen.has(booking.id)) continue;
    seen.add(booking.id);

    await activateEmergencyList(booking.id, {
      excludeCleanerIds: [row.cleaner_id],
    });
    cascaded.push(booking.id);
  }

  return NextResponse.json({ cascaded: cascaded.length, ids: cascaded });
}
