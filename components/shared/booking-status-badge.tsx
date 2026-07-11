import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/customer";

const statusStyles: Record<BookingStatus, string> = {
  pending_match: "bg-amber-100 text-amber-800",
  matched: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  cleaner_en_route: "bg-violet-100 text-violet-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-700",
  no_show: "bg-red-100 text-red-800",
  disputed: "bg-rose-100 text-rose-800",
};

export function BookingStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: BookingStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        statusStyles[status],
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
