import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import {
  activateEmergencyList,
  closeEmergencyList,
  nextConfirmationGate,
  pruneEmergencyListConflicts,
} from "@/lib/matching/emergency-list";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * T−24h / T−6h / T−1h confirmation gates + reserve prune + close at job start.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: active } = await admin
    .from("bookings")
    .select(
      "id,cleaner_id,customer_id,scheduled_date,scheduled_start_time,status,confirmation_gate,confirmation_due_at,confirmation_responded_at,booking_protected",
    )
    .in("status", ["matched", "confirmed", "cleaner_en_route"])
    .gte("scheduled_date", now.toISOString().slice(0, 10));

  const opened: string[] = [];
  const failed: string[] = [];
  const pruned: string[] = [];
  const closed: string[] = [];

  for (const booking of active ?? []) {
    const start = new Date(
      `${booking.scheduled_date}T${booking.scheduled_start_time}`,
    );

    if (start.getTime() <= now.getTime()) {
      if (booking.booking_protected) {
        await closeEmergencyList(booking.id);
        closed.push(booking.id);
      }
      continue;
    }

    const pruneResult = await pruneEmergencyListConflicts(booking.id);
    if (pruneResult.removed.length) pruned.push(booking.id);

    if (
      booking.confirmation_due_at &&
      booking.confirmation_gate &&
      booking.confirmation_gate !== "none" &&
      !booking.confirmation_responded_at &&
      new Date(booking.confirmation_due_at).getTime() <= now.getTime()
    ) {
      await activateEmergencyList(booking.id, {
        excludeCleanerIds: booking.cleaner_id ? [booking.cleaner_id] : [],
      });
      failed.push(booking.id);
      continue;
    }

    const next = nextConfirmationGate(start, now);
    if (
      next &&
      booking.cleaner_id &&
      booking.status === "confirmed" &&
      booking.confirmation_gate !== next.gate
    ) {
      await admin
        .from("bookings")
        .update({
          confirmation_due_at: next.dueAt.toISOString(),
          confirmation_gate: next.gate,
          confirmation_responded_at: null,
        })
        .eq("id", booking.id);

      await sendPushNotification(
        booking.cleaner_id,
        next.gate === "t1"
          ? "Confirm you're on the way"
          : "Please confirm this booking",
        next.gate === "t24"
          ? "Confirm within the next 2 hours that you can still take this clean."
          : next.gate === "t6"
            ? "Reconfirm this clean — the window is shorter now."
            : "Mark yourself on the way so the customer stays protected.",
        { booking_id: booking.id, gate: next.gate },
      );
      opened.push(booking.id);
    }
  }

  return NextResponse.json({
    closed: closed.length,
    failed: failed.length,
    opened: opened.length,
    pruned: pruned.length,
  });
}
