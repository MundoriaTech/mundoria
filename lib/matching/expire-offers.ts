import { refundBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { activateEmergencyList } from "@/lib/matching/emergency-list";

function visitStart(date: string, time: string) {
  return new Date(`${date}T${String(time).slice(0, 5)}:00`);
}

/**
 * Close offers the cleaner never answered.
 * Future visits are offered to the next cleaner. Visits that already started
 * are cancelled and any card hold is released.
 */
export async function settleOutstandingOffers(scope?: {
  cleanerId?: string;
  customerId?: string;
}) {
  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const today = nowIso.slice(0, 10);
  const past: Array<{
    id: string;
    payment_status: string;
    scheduled_date: string;
    scheduled_start_time: string;
    stripe_payment_intent_id: string | null;
  }> = [];

  for (let page = 0; page < 20; page += 1) {
    let query = admin
      .from("bookings")
      .select(
        "id,status,scheduled_date,scheduled_start_time,payment_status,stripe_payment_intent_id",
      )
      .in("status", ["pending_match", "matched"])
      .lte("scheduled_date", today);
    if (scope?.customerId) query = query.eq("customer_id", scope.customerId);
    if (scope?.cleanerId) query = query.eq("cleaner_id", scope.cleanerId);
    const { data } = await query.range(page * 200, page * 200 + 199);
    if (!data?.length) break;
    past.push(...data);
    if (data.length < 200) break;
  }

  let closedPast = 0;
  for (const booking of past) {
    const start = visitStart(
      booking.scheduled_date,
      booking.scheduled_start_time,
    );
    if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) {
      continue;
    }

    if (booking.payment_status === "held" && booking.stripe_payment_intent_id) {
      try {
        await refundBookingPayment(booking.id);
      } catch {
        // Still close the visit so it does not sit as an active job.
      }
    }

    const { error } = await admin
      .from("bookings")
      .update({
        cancellation_reason: "No cleaner confirmed before the visit.",
        cancelled_at: nowIso,
        payment_status:
          booking.payment_status === "held" ? "refunded" : booking.payment_status,
        status: "cancelled",
      })
      .eq("id", booking.id)
      .in("status", ["pending_match", "matched"]);
    if (!error) closedPast += 1;
  }

  let offerQuery = admin
    .from("cleaner_job_responses")
    .select(
      "booking_id,cleaner_id,bookings!inner(id,customer_id,cleaner_id,status,scheduled_date,scheduled_start_time)",
    )
    .eq("response", "expired")
    .not("expires_at", "is", null)
    .lte("expires_at", nowIso)
    .is("responded_at", null)
    .limit(scope ? 40 : 100);
  if (scope?.cleanerId) {
    offerQuery = offerQuery.eq("cleaner_id", scope.cleanerId);
  }
  const { data: expired } = await offerQuery;

  const cascaded: string[] = [];
  const seen = new Set<string>();

  for (const row of expired ?? []) {
    const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    if (!booking) continue;
    if (scope?.customerId && booking.customer_id !== scope.customerId) continue;
    const start = visitStart(
      booking.scheduled_date,
      booking.scheduled_start_time,
    );
    if (!Number.isNaN(start.getTime()) && start.getTime() <= now.getTime()) {
      continue;
    }
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

  return { cascaded: cascaded.length, closedPast, ids: cascaded };
}
