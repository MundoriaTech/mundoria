import { ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

import { CrmLink } from "@/components/analytics/crm-link";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import type { Booking, BookingStatus } from "@/types/customer";

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  pending_match:    { bg: "#FFF5E6", color: "#C17E24", label: "Matching cleaner" },
  matched:          { bg: "#FFF5E6", color: "#C17E24", label: "Matched" },
  awaiting_payment: { bg: "#EAE7F5", color: "#524096", label: "Cleaner accepted" },
  confirmed:        { bg: "#EAE7F5", color: "#524096", label: "Confirmed" },
  cleaner_en_route: { bg: "#E8F0FF", color: "#2D5BE3", label: "En route" },
  in_progress:      { bg: "#E0F4EB", color: "#1A7A4A", label: "In progress" },
  awaiting_customer_confirmation: { bg: "#E0F4EB", color: "#1A7A4A", label: "Confirm clean" },
  completed:        { bg: "#E0F4EB", color: "#1A7A4A", label: "Completed" },
  cancelled:        { bg: "#F0F0F0", color: "#6B6B70", label: "Cancelled" },
  no_show:          { bg: "#FEE9E9", color: "#C0272D", label: "No show" },
  disputed:         { bg: "#FEE9E9", color: "#C0272D", label: "Disputed" },
};

export function BookingCard({
  booking,
  compact = false,
  showRebook = false,
}: {
  booking: Booking;
  compact?: boolean;
  showRebook?: boolean;
}) {
  const when = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`);
  const day = when.toLocaleDateString("en-GB", { day: "numeric" });
  const month = when.toLocaleDateString("en-GB", { month: "short" });
  const weekday = when.toLocaleDateString("en-GB", { weekday: "short" });
  const hours = parseInt(booking.scheduled_start_time.split(":")[0] ?? "0");
  const mins = booking.scheduled_start_time.split(":")[1] ?? "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeFormatted = `${h12}:${mins} ${ampm}`;
  const person = booking.cleaner?.full_name?.split(" ")[0] ?? null;
  const place = booking.address
    ? compact
      ? (booking.address.city ?? booking.address.postcode)
      : (booking.address.city ?? booking.address.postcode)
    : null;

  const pill = STATUS_PILL[booking.status as BookingStatus] ?? STATUS_PILL.cancelled!;

  return (
    <li className="mb-[6px] list-none">
      <div className="group flex flex-col overflow-hidden rounded-[14px] bg-[#F3F4F6] transition-colors hover:bg-white hover:shadow-sm sm:flex-row sm:items-stretch">
        <CrmLink
          className="flex min-w-0 flex-1 items-start gap-3 p-3.5 sm:items-center sm:gap-4 sm:p-4"
          crmEvent="booking_request_view"
          crmPayload={{
            action: "View request",
            booking_amount:
              typeof booking.amount_total === "number"
                ? booking.amount_total / 100
                : null,
            booking_currency: "GBP",
            booking_datetime: `${booking.scheduled_date}T${booking.scheduled_start_time}`,
            booking_id: booking.id,
            item: bookingServiceName(booking),
            service: booking.service_type,
            service_location: place,
          }}
          href={`/booking/${booking.id}`}
          style={{ textDecoration: "none" }}
        >
          {/* Date block */}
          <div className="flex h-[52px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-white px-1 py-1.5 sm:h-auto sm:min-h-[56px] sm:w-[52px] sm:px-1 sm:py-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8B8798] sm:text-[10px]">
              {month}
            </span>
            <span className="text-[20px] font-bold leading-[22px] tracking-[-0.02em] text-[#1E1848] sm:text-[24px] sm:leading-[26px]">
              {day}
            </span>
            <span className="text-[9px] tracking-[0.04em] text-[#8B8798] sm:text-[10px]">
              {weekday}
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[14.5px] font-bold leading-snug text-[#1E1848] sm:text-[15px]">
                {bookingServiceName(booking)}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full"
                style={{
                  height: "24px",
                  padding: "0 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: pill.bg,
                  color: pill.color,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: "5px", height: "5px", background: pill.color }}
                />
                {pill.label}
              </span>
            </div>
            <p className="m-0 mt-1 truncate text-[13px] text-[#5F5F66] sm:text-[13.5px]">
              {timeFormatted}
              {person ? ` · ${person}` : ""}
              {place ? ` · ${place}` : ""}
            </p>
            {booking.amount_total ? (
              <p className="m-0 mt-1 text-[14px] font-bold text-[#524096] sm:text-[14.5px]">
                {formatMoney(booking.amount_total)}
              </p>
            ) : null}
          </div>

          <ChevronRight
            className="mt-1.5 shrink-0 sm:ml-2 sm:mt-0"
            style={{ width: "18px", height: "18px", color: "#C4BFD4" }}
          />
        </CrmLink>

        {showRebook ? (
          <div className="flex border-t border-black/[0.04] px-3.5 pb-3.5 pt-0 sm:items-center sm:border-t-0 sm:p-0 sm:pr-4">
            <Link
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#D4CCEA] text-[13px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6] sm:w-auto sm:px-3.5"
              href={`/booking/new?rebook=${booking.id}`}
            >
              <RotateCcw style={{ width: "13px", height: "13px" }} />
              Rebook
            </Link>
          </div>
        ) : null}
      </div>
    </li>
  );
}
