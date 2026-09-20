import type { BookingStatus } from "@/types/customer";

/** Customer still waiting for a cleaner to accept the offer. */
export function isWaitingForCleanerAcceptance(status: BookingStatus): boolean {
  return status === "pending_match" || status === "matched";
}

/** Cleaner identity / messaging is only shown after acceptance. */
export function isCleanerVisibleToCustomer(status: BookingStatus): boolean {
  return (
    status === "confirmed" ||
    status === "cleaner_en_route" ||
    status === "in_progress" ||
    status === "awaiting_customer_confirmation" ||
    status === "completed" ||
    status === "disputed" ||
    status === "no_show"
  );
}

export function formatConfirmByDeadline(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
