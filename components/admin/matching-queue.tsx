"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  MATCHING_QUEUE_LABELS,
  MATCHING_QUEUES,
  groupMatchingQueues,
  stuckReason,
  type MatchingQueueId,
} from "@/lib/admin/matching-queue";
import { formatServiceName } from "@/lib/customer/services";
import type { AdminBooking } from "@/types/admin";
import type { BookingStatus } from "@/types/customer";

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  awaiting_customer_confirmation: { bg: "#E0F4EB", color: "#1A7A4A", label: "Confirm clean" },
  awaiting_payment: { bg: "#FFF5E6", color: "#C17E24", label: "Awaiting payment" },
  cancelled: { bg: "#F0F0F0", color: "#6B6B70", label: "Cancelled" },
  cleaner_en_route: { bg: "#E8F0FF", color: "#2D5BE3", label: "En route" },
  confirmed: { bg: "#EAE7F5", color: "#524096", label: "Confirmed" },
  disputed: { bg: "#FEE9E9", color: "#C0272D", label: "Disputed" },
  in_progress: { bg: "#E0F4EB", color: "#1A7A4A", label: "In progress" },
  matched: { bg: "#FFF5E6", color: "#C17E24", label: "Matched" },
  no_show: { bg: "#FEE9E9", color: "#C0272D", label: "No show" },
  pending_match: { bg: "#FFF5E6", color: "#C17E24", label: "Pending match" },
};

function placeLabel(booking: AdminBooking) {
  const parts = [
    booking.address?.address_line_1,
    booking.address?.city,
    booking.address?.postcode,
  ].filter(Boolean);
  return parts.join(", ") || "No address";
}

function visitLabel(booking: AdminBooking) {
  const when = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time || "00:00:00"}`,
  );
  if (Number.isNaN(when.getTime())) {
    return booking.scheduled_date;
  }
  return when.toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  });
}

function waitLabel(iso: string) {
  const started = new Date(iso).getTime();
  if (!Number.isFinite(started)) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - started) / 60_000));
  if (minutes < 60) return `${minutes}m waiting`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h waiting`;
  return `${Math.floor(hours / 24)}d waiting`;
}

function durationLabel(booking: AdminBooking) {
  const hours = booking.estimated_duration_hours;
  if (hours == null) return null;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

function StatusPill({ status }: { status: BookingStatus }) {
  const pill = STATUS_PILL[status];
  if (!pill) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[13.5px] font-semibold"
      style={{
        background: pill.bg,
        color: pill.color,
        height: "28px",
        padding: "0 12px",
      }}
    >
      <span
        className="rounded-full"
        style={{ background: pill.color, flexShrink: 0, height: "6px", width: "6px" }}
      />
      {pill.label}
    </span>
  );
}

function QueueRow({
  booking,
  queue,
}: {
  booking: AdminBooking;
  queue: MatchingQueueId;
}) {
  const reason = queue === "stuck" ? stuckReason(booking) : null;
  const wait =
    queue === "needs_cleaner" || queue === "waiting_cleaner"
      ? waitLabel(booking.updated_at || booking.created_at)
      : null;
  const duration = durationLabel(booking);

  return (
    <Link
      className="block rounded-[14px] bg-[#F3F4F6] p-4 transition hover:bg-white hover:shadow-sm"
      href={`/admin/booking/${booking.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
            {visitLabel(booking)}
          </p>
          <p className="mt-1 m-0 truncate text-[13.5px] text-[#5F5F66]">
            {placeLabel(booking)}
          </p>
          <p className="mt-1 m-0 text-[13.5px] text-[#3D335F]">
            {formatServiceName(booking.service_type)}
            {duration ? ` · ${duration}` : ""}
          </p>
        </div>
        <StatusPill status={booking.status as BookingStatus} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
        <span className="text-[#5F5F66]">
          {booking.customer?.full_name ?? "Customer"}
          {" · "}
          {booking.cleaner_profile?.full_name ?? "Unassigned"}
        </span>
        <span className="font-semibold text-[#524096]">
          {reason ?? wait ?? "Open"}
        </span>
      </div>
    </Link>
  );
}

export function MatchingQueue({
  bookings,
  today,
}: {
  bookings: AdminBooking[];
  today: string;
}) {
  const groups = useMemo(
    () => groupMatchingQueues(bookings, today),
    [bookings, today],
  );
  const defaultTab =
    MATCHING_QUEUES.find((id) => groups[id].length > 0) ?? "needs_cleaner";
  const [tab, setTab] = useState<MatchingQueueId>(defaultTab);
  const rows = groups[tab];

  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-white p-5">
      <div
        className="relative flex min-h-[70px] flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[14px] px-6"
        style={{
          background:
            "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)",
          }}
        />
        <div className="relative flex flex-col gap-0.5">
          <h2
            className="m-0 text-[22.8px] font-semibold leading-none text-white"
            style={{ letterSpacing: "-0.01em" }}
          >
            Matching
          </h2>
          <span className="text-[15px] text-white">
            Jobs that still need someone on the desk
          </span>
        </div>
      </div>

      <div className="flex h-[46px] flex-wrap items-center gap-1 rounded-full bg-[#E7E7EF] px-[5px] py-[5px] sm:flex-nowrap sm:py-0">
        {MATCHING_QUEUES.map((id) => {
          const active = tab === id;
          const count = groups[id].length;
          return (
            <button
              className="whitespace-nowrap rounded-full text-[14.5px] font-semibold transition-colors"
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: active ? "#524096" : "transparent",
                border: "none",
                color: active ? "#FFFFFF" : "#524096",
                cursor: "pointer",
                fontFamily: "inherit",
                height: "36px",
                padding: "0 14px",
              }}
              type="button"
            >
              {MATCHING_QUEUE_LABELS[id]}
              {count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((booking) => (
          <QueueRow booking={booking} key={booking.id} queue={tab} />
        ))}
        {!rows.length ? (
          <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="m-0 text-[17.4px] font-semibold text-[#1E1848]">
              Nothing in this queue
            </p>
            <p className="mt-2 m-0 text-[14.5px] text-[#6B6B70]">
              {tab === "needs_cleaner"
                ? "Every open booking has a cleaner, or none are waiting to be matched."
                : tab === "waiting_cleaner"
                  ? "No matched jobs waiting for the cleaner to confirm."
                  : tab === "live_today"
                    ? "No confirmed or in-progress jobs scheduled for today."
                    : "No payment, dispute, or rematch issues right now."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
