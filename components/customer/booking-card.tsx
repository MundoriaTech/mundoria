import { ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import type { Booking } from "@/types/customer";

export function BookingCard({
  booking,
  compact = false,
  showRebook = false,
}: {
  booking: Booking;
  compact?: boolean;
  showRebook?: boolean;
}) {
  const when = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  );
  const day = when.toLocaleDateString("en-GB", { day: "numeric" });
  const month = when.toLocaleDateString("en-GB", { month: "short" });
  const weekday = when.toLocaleDateString("en-GB", { weekday: "short" });
  const time = booking.scheduled_start_time.slice(0, 5);
  const place = booking.address
    ? compact
      ? (booking.address.city ?? booking.address.postcode)
      : `${booking.address.address_line_1}, ${booking.address.city}`
    : null;
  const person = booking.cleaner?.full_name?.split(" ")[0] ?? null;

  return (
    <li className="border-b border-[#ece8f3] last:border-b-0 dark:border-border">
      <div className="flex items-start gap-3 py-4 sm:gap-4 sm:py-5">
        <Link
          className="group flex min-w-0 flex-1 items-start gap-3 sm:gap-4"
          href={`/booking/${booking.id}`}
        >
          <div className="flex w-12 shrink-0 flex-col items-center pt-0.5 leading-none">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#8b8798]">
              {month}
            </span>
            <span className="mt-0.5 text-xl font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
              {day}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#1c133b] dark:text-foreground sm:text-[15px]">
                {formatServiceName(booking.service_type)}
              </h3>
              <BookingStatusBadge
                className="!bg-[#f3efe6] !text-[#312c79]"
                status={booking.status}
              />
            </div>
            <p className="mt-1 truncate text-xs text-[#5a5470] dark:text-muted-foreground sm:text-sm">
              {weekday} · {time}
              {person ? ` · ${person}` : ""}
              {place ? ` · ${place}` : ""}
            </p>
            {booking.amount_total ? (
              <p className="mt-1.5 text-sm font-semibold tracking-tight text-[#1c133b] dark:text-foreground">
                {formatMoney(booking.amount_total)}
              </p>
            ) : null}
          </div>

          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#c4bfd4] transition group-hover:text-[#6a45b8]" />
        </Link>

        {showRebook ? (
          <Link
            className="mt-0.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#e4dcf2] bg-white px-3 text-xs font-semibold text-[#312c79] transition hover:bg-[#f7f2ea] dark:border-border dark:bg-card"
            href={`/booking/new?rebook=${booking.id}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Rebook
          </Link>
        ) : null}
      </div>
    </li>
  );
}
