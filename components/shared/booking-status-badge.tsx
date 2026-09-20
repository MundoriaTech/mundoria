import { cn } from "@/lib/utils";
import { isWaitingForCleanerAcceptance } from "@/lib/customer/booking-visibility";
import type { BookingStatus } from "@/types/customer";

const statusStyles: Record<BookingStatus, string> = {
  pending_match: "bg-amber-100 text-amber-800",
  matched: "bg-amber-100 text-amber-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  cleaner_en_route: "bg-violet-100 text-violet-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  awaiting_customer_confirmation: "bg-teal-100 text-teal-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-red-100 text-red-800",
  disputed: "bg-rose-100 text-rose-800",
};

const statusLabels: Record<BookingStatus, string> = {
  pending_match: "Looking for cleaner",
  matched: "Looking for cleaner",
  confirmed: "Confirmed",
  cleaner_en_route: "En route",
  in_progress: "In progress",
  awaiting_customer_confirmation: "Confirm clean",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  disputed: "Disputed",
};

export function BookingStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: BookingStatus;
}) {
  const label = isWaitingForCleanerAcceptance(status)
    ? "Looking for cleaner"
    : statusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
