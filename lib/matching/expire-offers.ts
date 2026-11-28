import { refundBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { activateEmergencyList } from "@/lib/matching/emergency-list";
import { isAutoCancelProtected } from "@/lib/bookings/auto-cancel-test";
import { noteBookingInZoho } from "@/lib/zoho/booking-notes";

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
        "id,customer_id,status,scheduled_date,scheduled_start_time,payment_status,stripe_payment_intent_id",
      )
      .in("status", ["pending_match", "matched"])
      .lte("scheduled_date", today)
      // Bookings an admin protected are never cancelled automatically.
      .eq("auto_cancel_exempt", false);
    if (scope?.customerId) query = query.eq("customer_id", scope.customerId);
    if (scope?.cleanerId) query = query.eq("cleaner_id", scope.cleanerId);
    const { data } = await query.range(page * 200, page * 200 + 199);
    if (!data?.length) break;
    past.push(...data.filter((row) => !isAutoCancelProtected(row)));
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
    if (!error) {
      closedPast += 1;
      await noteBookingInZoho(booking.id, "Cancelled: no cleaner confirmed", "No cleaner confirmed before the visit time.");
    }
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
    // Close the offer so it is handled once and never re-read on later runs.
    await admin
      .from("cleaner_job_responses")
      .update({ responded_at: nowIso })
      .eq("booking_id", row.booking_id)
      .eq("cleaner_id", row.cleaner_id)
      .is("responded_at", null);

    const start = visitStart(
      booking.scheduled_date,
      booking.scheduled_start_time,
    );
    if (!Number.isNaN(start.getTime()) && start.getTime() <= now.getTime()) {
      continue;
    }

    if (!["matched", "pending_match"].includes(booking.status)) continue;
    // The primary held the booking and let it lapse, or a reserve wave (no
    // cleaner on the booking) has run out. Anything else is already handled.
    const primaryLapsed = booking.cleaner_id === row.cleaner_id;
    const waveLapsed =
      booking.cleaner_id === null && booking.status === "pending_match";
    if (!primaryLapsed && !waveLapsed) continue;
    if (seen.has(booking.id)) continue;

    const { data: offers } = await admin
      .from("cleaner_job_responses")
      .select("cleaner_id,expires_at,responded_at")
      .eq("booking_id", booking.id);
    // Wait while anyone from the current wave can still accept.
    const stillOpen = (offers ?? []).some(
      (offer) =>
        !offer.responded_at &&
        offer.expires_at &&
        new Date(offer.expires_at).getTime() > now.getTime(),
    );
    if (stillOpen) continue;

    seen.add(booking.id);
    // Don't re-offer to anyone who already let this booking expire; when
    // nobody is left, matching alerts the admins once.
    await activateEmergencyList(booking.id, {
      excludeCleanerIds: Array.from(
        new Set([
          row.cleaner_id as string,
          ...(offers ?? []).map((offer) => offer.cleaner_id as string),
        ]),
      ),
    });
    cascaded.push(booking.id);
  }

  return { cascaded: cascaded.length, closedPast, ids: cascaded };
}
