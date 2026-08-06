import { CalendarDays, Clock3, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";

import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { formatServiceName } from "@/lib/customer/services";
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
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold">
            {formatServiceName(booking.service_type)}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {booking.cleaner?.full_name ?? "Finding your cleaner"}
          </p>
        </div>
        <BookingStatusBadge className="self-start" status={booking.status} />
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />
          {new Date(`${booking.scheduled_date}T12:00:00`).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" },
          )}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0" />
          {booking.scheduled_start_time.slice(0, 5)}
        </p>
        {!compact ? (
          <p className="flex items-center gap-2 sm:col-span-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              {booking.address
                ? `${booking.address.address_line_1}, ${booking.address.city}`
                : "Address unavailable"}
            </span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
        <span className="text-sm font-semibold">
          {booking.amount_total ? (
            <PriceDisplay amount={booking.amount_total} />
          ) : (
            "Pending"
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          {showRebook ? (
            <Button asChild className="min-h-11" size="sm" variant="outline">
              <Link href={`/booking/new?rebook=${booking.id}`}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Rebook
              </Link>
            </Button>
          ) : null}
          <Button asChild className="min-h-11" size="sm" variant="ghost">
            <Link href={`/booking/${booking.id}`}>View details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
