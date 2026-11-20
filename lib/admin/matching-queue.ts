import type { AdminBooking } from "@/types/admin";

export const MATCHING_QUEUES = [
  "needs_cleaner",
  "waiting_cleaner",
  "live_today",
  "stuck",
] as const;

export type MatchingQueueId = (typeof MATCHING_QUEUES)[number];

export const MATCHING_QUEUE_LABELS: Record<MatchingQueueId, string> = {
  live_today: "Live today",
  needs_cleaner: "Needs a cleaner",
  stuck: "Stuck",
  waiting_cleaner: "Waiting on cleaner",
};

function visitStamp(booking: AdminBooking) {
  return `${booking.scheduled_date}T${booking.scheduled_start_time || "00:00:00"}`;
}

export function stuckReason(booking: AdminBooking): string | null {
  if (booking.status === "disputed") return "Dispute open";
  if (booking.status === "no_show") return "No-show";
  if (booking.status === "awaiting_payment") return "Payment not authorised";
  if (booking.status === "cancelled" && booking.payment_status === "held") {
    return "Cancelled with funds held";
  }
  if (booking.payment_preauth_failed_at) return "Pre-auth failed";
  return null;
}

export function matchingQueueFor(
  booking: AdminBooking,
  today: string,
): MatchingQueueId | null {
  if (
    booking.status === "disputed" ||
    booking.status === "no_show" ||
    booking.status === "awaiting_payment" ||
    (booking.status === "cancelled" && booking.payment_status === "held") ||
    Boolean(booking.payment_preauth_failed_at)
  ) {
    return "stuck";
  }
  if (booking.status === "pending_match") return "needs_cleaner";
  if (booking.status === "matched") return "waiting_cleaner";
  if (
    booking.scheduled_date === today &&
    (booking.status === "confirmed" ||
      booking.status === "cleaner_en_route" ||
      booking.status === "in_progress" ||
      booking.status === "awaiting_customer_confirmation")
  ) {
    return "live_today";
  }
  return null;
}

export function sortByVisit(a: AdminBooking, b: AdminBooking) {
  return visitStamp(a).localeCompare(visitStamp(b));
}

export function groupMatchingQueues(
  bookings: AdminBooking[],
  today: string,
): Record<MatchingQueueId, AdminBooking[]> {
  const groups: Record<MatchingQueueId, AdminBooking[]> = {
    live_today: [],
    needs_cleaner: [],
    stuck: [],
    waiting_cleaner: [],
  };
  for (const booking of bookings) {
    const queue = matchingQueueFor(booking, today);
    if (queue) groups[queue].push(booking);
  }
  for (const key of MATCHING_QUEUES) {
    groups[key].sort(sortByVisit);
  }
  return groups;
}
