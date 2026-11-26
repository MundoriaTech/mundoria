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
      <div
        className="group flex items-stretch rounded-[14px] bg-[#F3F4F6] transition-colors hover:bg-white hover:shadow-sm"
        style={{ overflow: "hidden" }}
      >
        <CrmLink
          className="flex min-w-0 flex-1 items-center gap-4 p-4"
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
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-[10px] bg-white"
            style={{ width: "52px", minHeight: "56px", padding: "8px 4px" }}
          >
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8B8798" }}>{month}</span>
            <span style={{ fontSize: "24px", fontWeight: 700, lineHeight: "26px", letterSpacing: "-0.02em", color: "#1E1848" }}>{day}</span>
            <span style={{ fontSize: "10px", color: "#8B8798", letterSpacing: "0.04em" }}>{weekday}</span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#1E1848", whiteSpace: "nowrap" }}>
                {bookingServiceName(booking)}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full"
                style={{ height: "24px", padding: "0 10px", fontSize: "12px", fontWeight: 600, background: pill.bg, color: pill.color, whiteSpace: "nowrap" }}
              >
                <span className="rounded-full" style={{ width: "5px", height: "5px", background: pill.color, flexShrink: 0 }} />
                {pill.label}
              </span>
            </div>
            <p style={{ fontSize: "13.5px", color: "#5F5F66", marginTop: "3px", marginBottom: 0 }}>
              {timeFormatted}{person ? ` · ${person}` : ""}{place ? ` · ${place}` : ""}
            </p>
            {booking.amount_total ? (
              <p style={{ fontSize: "14.5px", fontWeight: 700, color: "#524096", marginTop: "4px", marginBottom: 0 }}>
                {formatMoney(booking.amount_total)}
              </p>
            ) : null}
          </div>

          <ChevronRight className="ml-2 shrink-0" style={{ width: "18px", height: "18px", color: "#C4BFD4" }} />
        </CrmLink>

        {showRebook ? (
          <div className="flex items-center pr-4">
            <Link
              className="inline-flex items-center gap-1.5 rounded-full font-semibold transition hover:bg-[#ECE8F6]"
              href={`/booking/new?rebook=${booking.id}`}
              style={{ height: "36px", padding: "0 14px", fontSize: "13px", color: "#524096", border: "1.5px solid #D4CCEA", whiteSpace: "nowrap", textDecoration: "none" }}
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
