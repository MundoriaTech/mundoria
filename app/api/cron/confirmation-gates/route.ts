import { bookingStartUtc } from "@/lib/payments/uk-schedule";
import { addDays, format } from "date-fns";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import {
  closeEmergencyList,
  nextConfirmationGate,
  pruneEmergencyListConflicts,
} from "@/lib/matching/emergency-list";
import { alertAdmins } from "@/lib/notifications/admin";
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
  const today = format(now, "yyyy-MM-dd");
  // T−24 opens at most 25 hours ahead, which can fall on the day after tomorrow.
  const horizon = format(addDays(now, 2), "yyyy-MM-dd");

  const { data: active } = await admin
    .from("bookings")
    .select(
      "id,cleaner_id,customer_id,scheduled_date,scheduled_start_time,status,confirmation_gate,confirmation_due_at,confirmation_responded_at,booking_protected",
    )
    .in("status", ["matched", "confirmed", "cleaner_en_route"])
    .gte("scheduled_date", today)
    .lte("scheduled_date", horizon);

  const opened: string[] = [];
  const failed: string[] = [];
  const pruned: string[] = [];
  const closed: string[] = [];

  for (const booking of active ?? []) {
    const start = bookingStartUtc(
      booking.scheduled_date,
      String(booking.scheduled_start_time).slice(0, 5),
    );
    if (!start) continue;

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
      // A missed check no longer removes the cleaner: they keep the job,
      // admins are alerted to follow up, and the cleaner is reminded.
      // Clearing the due time stops this alert repeating on the next run;
      // the gate stays recorded, so the same check isn't reopened.
      await admin
        .from("bookings")
        .update({ confirmation_due_at: null })
        .eq("id", booking.id);
      const { data: cleaner } = booking.cleaner_id
        ? await admin.from("profiles").select("full_name,phone").eq("id", booking.cleaner_id).maybeSingle()
        : { data: null };
      const when = `${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)}`;
      const gateLabel =
        booking.confirmation_gate === "t1"
          ? "1 hour"
          : booking.confirmation_gate === "t6"
            ? "6 hour"
            : "24 hour";
      await alertAdmins(
        "cleaner_missed_confirmation",
        "Cleaner hasn't confirmed a visit",
        `${cleaner?.full_name ?? "The assigned cleaner"} didn't answer the ${gateLabel} check for the visit on ${when}. They're still assigned. Contact them${cleaner?.phone ? ` (${cleaner.phone})` : ""} and reassign from Matching only if they can't make it.`,
        { booking_id: booking.id, cleaner_id: booking.cleaner_id, gate: booking.confirmation_gate },
      ).catch(() => undefined);
      if (booking.cleaner_id) {
        await sendPushNotification(
          booking.cleaner_id,
          "Please confirm your visit",
          `You didn't confirm the visit on ${when}. Open the job and confirm, or message Mundoria if you can't make it.`,
          { booking_id: booking.id },
        ).catch(() => undefined);
      }
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
            ? "Reconfirm this clean, the window is shorter now."
            : "Mark yourself on the way so the customer stays protected.",
        { booking_id: booking.id, gate: next.gate },
      );
      opened.push(booking.id);
    }
  }

  const checkout = await chaseMissingCheckouts(admin, now);

  return NextResponse.json({
    checkoutAlerts: checkout.alerted,
    checkoutReminders: checkout.reminded,
    closed: closed.length,
    failed: failed.length,
    opened: opened.length,
    pruned: pruned.length,
  });
}

const REMIND_AFTER_MS = 30 * 60 * 1000;
const ALERT_AFTER_MS = 2 * 60 * 60 * 1000;

/**
 * A clean still "in progress" well after its booked end usually means the
 * cleaner forgot to check out, and then the customer is never charged (the
 * card hold lapses). Remind the cleaner 30 minutes after the booked end, then
 * alert admins at 2 hours so someone marks it completed. Each fires once,
 * recorded in matching_decisions.
 */
async function chaseMissingCheckouts(
  admin: ReturnType<typeof createAdminClient>,
  now: Date,
) {
  const result = { alerted: 0, reminded: 0 };
  const { data: running } = await admin
    .from("bookings")
    .select("id,cleaner_id,scheduled_date,scheduled_start_time,estimated_duration_hours,actual_start_time")
    .eq("status", "in_progress")
    .limit(200);
  for (const booking of running ?? []) {
    const started = booking.actual_start_time
      ? new Date(booking.actual_start_time)
      : bookingStartUtc(booking.scheduled_date, String(booking.scheduled_start_time).slice(0, 5));
    if (!started || Number.isNaN(started.getTime())) continue;
    const end = started.getTime() + Number(booking.estimated_duration_hours ?? 2) * 60 * 60 * 1000;
    const over = now.getTime() - end;
    if (over < REMIND_AFTER_MS) continue;

    const { data: sent } = await admin
      .from("matching_decisions")
      .select("decision")
      .eq("booking_id", booking.id)
      .in("decision", ["checkout_reminder", "checkout_overdue_alert"]);
    const done = new Set((sent ?? []).map((row) => row.decision as string));

    if (!done.has("checkout_reminder") && booking.cleaner_id) {
      await sendPushNotification(
        booking.cleaner_id,
        "Don't forget to check out",
        "Your booked time has ended. Tap \"I've finished\" on the job so the visit is completed and you're paid.",
        { booking_id: booking.id },
      ).catch(() => undefined);
      await admin.from("matching_decisions").insert({
        booking_id: booking.id,
        cleaner_id: booking.cleaner_id,
        decision: "checkout_reminder",
        reasons: { minutes_over: Math.round(over / 60000) },
      });
      result.reminded += 1;
    }

    if (over >= ALERT_AFTER_MS && !done.has("checkout_overdue_alert")) {
      await alertAdmins(
        "checkout_overdue",
        "A clean hasn't been checked out",
        `The visit on ${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)} is still marked in progress more than 2 hours after its booked end. Check with the cleaner, then mark it completed from the booking page so the customer's payment is taken before the card hold expires.`,
        { booking_id: booking.id },
      ).catch(() => undefined);
      await admin.from("matching_decisions").insert({
        booking_id: booking.id,
        cleaner_id: booking.cleaner_id,
        decision: "checkout_overdue_alert",
        reasons: { minutes_over: Math.round(over / 60000) },
      });
      result.alerted += 1;
    }
  }
  return result;
}
