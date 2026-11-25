"use client";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  MATCHING_QUEUE_LABELS,
  MATCHING_QUEUES,
  groupMatchingQueues,
  stuckReason,
  type MatchingQueueId,
} from "@/lib/admin/matching-queue";
import { formatServiceName } from "@/lib/customer/services";
import { useFeedback } from "@/components/shared/feedback-provider";
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

const GRID =
  "minmax(132px,0.9fr) minmax(110px,0.8fr) minmax(140px,1.1fr) minmax(120px,1fr) minmax(88px,0.6fr) minmax(220px,1.2fr)";

function placeLabel(booking: AdminBooking) {
  const city = booking.address?.city?.trim();
  const postcode = booking.address?.postcode?.trim();
  if (city && postcode) return `${city}, ${postcode}`;
  return postcode || city || "—";
}

function visitLabel(booking: AdminBooking) {
  const when = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time || "00:00:00"}`,
  );
  if (Number.isNaN(when.getTime())) return booking.scheduled_date;
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
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function durationLabel(booking: AdminBooking) {
  const hours = booking.estimated_duration_hours;
  if (hours == null) return "";
  return hours === 1 ? " · 1h" : ` · ${hours}h`;
}

function StatusPill({ status }: { status: BookingStatus }) {
  const pill = STATUS_PILL[status];
  if (!pill) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold"
      style={{
        background: pill.bg,
        color: pill.color,
        height: "26px",
        padding: "0 10px",
      }}
    >
      {pill.label}
    </span>
  );
}

function AssignPicker({
  busy,
  cleaners,
  label,
  onAssign,
}: {
  busy: boolean;
  cleaners: { id: string; full_name: string }[];
  label: string;
  onAssign: (cleanerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cleaners.slice(0, 40);
    return cleaners
      .filter((cleaner) => cleaner.full_name.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [cleaners, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="inline-flex h-8 items-center rounded-full bg-[#524096] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {busy ? "Saving…" : label}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#E1E1EA] bg-white shadow-lg">
          <input
            className="h-10 w-full border-b border-[#E1E1EA] px-3 text-[13.5px] outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cleaners"
            ref={inputRef}
            value={query}
          />
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((cleaner) => (
              <button
                className="block w-full truncate px-3 py-2 text-left text-[13.5px] text-[#1c133b] hover:bg-[#F3F4F6]"
                key={cleaner.id}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  onAssign(cleaner.id);
                }}
                type="button"
              >
                {cleaner.full_name}
              </button>
            ))}
            {!filtered.length ? (
              <p className="px-3 py-3 text-[13px] text-[#6B6B70]">No match</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeskActions({
  booking,
  cleaners,
  queue,
}: {
  booking: AdminBooking;
  cleaners: { id: string; full_name: string }[];
  queue: MatchingQueueId;
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [busy, setBusy] = useState<"assign" | "engine" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "reassign" | "rematch", cleanerId?: string) {
    if (action === "reassign" && !cleanerId) return;
    if (action === "rematch") {
      const replacing = queue === "waiting_cleaner";
      const ok = await confirm({
        action: replacing ? "Find replacement" : "Run matching",
        description: replacing
          ? "This sends the job back into matching and excludes the current cleaner."
          : "This asks the matching engine to find a cleaner for this job.",
        title: replacing
          ? "Find a replacement cleaner?"
          : "Run automatic matching?",
        variant: replacing ? "destructive" : "default",
      });
      if (!ok) return;
    }

    setBusy(action === "reassign" ? "assign" : "engine");
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        body: JSON.stringify({
          action,
          cleanerId: action === "reassign" ? cleanerId : null,
          note:
            action === "reassign"
              ? "Assigned from Matching"
              : queue === "waiting_cleaner"
                ? "Rematch from Matching"
                : "Auto-match from Matching",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not update this booking.");
        return;
      }
      success({
        kind: "updated",
        title:
          action === "reassign"
            ? queue === "needs_cleaner"
              ? "Cleaner assigned"
              : "Cleaner reassigned"
            : queue === "waiting_cleaner"
              ? "Rematch started"
              : "Matching started",
        note: "The change is in the audit trail.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <AssignPicker
          busy={busy === "assign"}
          cleaners={cleaners}
          label={queue === "needs_cleaner" ? "Assign" : "Reassign"}
          onAssign={(id) => void run("reassign", id)}
        />
        {queue === "waiting_cleaner" ? (
          <button
            className="inline-flex h-8 items-center rounded-full border border-[#C0272D] px-3 text-[13px] font-semibold text-[#C0272D] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => void run("rematch")}
            type="button"
          >
            {busy === "engine" ? "Starting…" : "Rematch"}
          </button>
        ) : (
          <button
            className="inline-flex h-8 items-center rounded-full border border-[#D4CCEA] px-3 text-[13px] font-semibold text-[#524096] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => void run("rematch")}
            type="button"
          >
            {busy === "engine" ? "Starting…" : "Auto-match"}
          </button>
        )}
        <Link
          className="inline-flex h-8 items-center px-1 text-[13px] font-semibold text-[#524096] underline-offset-2 hover:underline"
          href={`/admin/booking/${booking.id}`}
        >
          Open
        </Link>
      </div>
      {error ? (
        <p className="m-0 max-w-[16rem] text-right text-[12px] font-medium text-[#C0272D]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function QueueRow({
  booking,
  cleaners,
  queue,
}: {
  booking: AdminBooking;
  cleaners: { id: string; full_name: string }[];
  queue: MatchingQueueId;
}) {
  const desk = queue === "needs_cleaner" || queue === "waiting_cleaner";
  const wait =
    queue === "needs_cleaner" || queue === "waiting_cleaner"
      ? waitLabel(booking.updated_at || booking.created_at)
      : stuckReason(booking);
  const cells = (
    <>
      <span className="text-[14.5px] font-semibold text-[#1E1848]">
        {visitLabel(booking)}
      </span>
      <span className="truncate text-[14.5px] text-[#5F5F66]">
        {placeLabel(booking)}
      </span>
      <span className="truncate text-[14.5px] text-[#3D335F]">
        {formatServiceName(booking.service_type)}
        {durationLabel(booking)}
      </span>
      <span className="min-w-0 truncate text-[14.5px] text-[#1E1848]">
        {booking.customer?.full_name ?? "Customer"}
        {queue === "waiting_cleaner" && booking.cleaner_profile?.full_name
          ? ` · ${booking.cleaner_profile.full_name}`
          : ""}
      </span>
      <span className="text-[13.5px] text-[#5F5F66]">{wait ?? "—"}</span>
    </>
  );

  if (!desk) {
    return (
      <Link
        className="mb-[2px] grid items-center gap-2 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-white"
        href={`/admin/booking/${booking.id}`}
        style={{ gridTemplateColumns: GRID }}
      >
        {cells}
        <span className="justify-self-end">
          <StatusPill status={booking.status as BookingStatus} />
        </span>
      </Link>
    );
  }

  return (
    <div
      className="mb-[2px] grid items-center gap-2 rounded-[12px] px-3 py-2.5 hover:bg-white"
      style={{ gridTemplateColumns: GRID }}
    >
      {cells}
      <DeskActions booking={booking} cleaners={cleaners} queue={queue} />
    </div>
  );
}

export function MatchingQueue({
  bookings,
  cleaners,
  today,
}: {
  bookings: AdminBooking[];
  cleaners: { id: string; full_name: string }[];
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
  const { page, pageItems: pagedRows, setPage, totalItems } = usePagedItems(
    rows,
    PAGE_SIZES.admin,
    tab,
  );

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

      <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#E7E7EF] px-[5px] py-[5px] sm:h-[46px] sm:flex-nowrap sm:py-0">
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

      <div className="overflow-x-auto rounded-[18px] bg-[#F3F4F6] p-[6px]">
        <div style={{ minWidth: "920px" }}>
          <div
            className="grid items-center gap-2 px-3 py-2.5"
            style={{ gridTemplateColumns: GRID }}
          >
            {["When", "Where", "Service", "Customer", "Wait", "Actions"].map(
              (col) => (
                <span
                  className="text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]"
                  key={col}
                >
                  {col}
                </span>
              ),
            )}
          </div>
          {pagedRows.map((booking) => (
            <QueueRow
              booking={booking}
              cleaners={cleaners}
              key={booking.id}
              queue={tab}
            />
          ))}
          {!rows.length ? (
            <div className="px-5 py-12 text-center">
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
      <ClientPagination
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.admin}
        totalItems={totalItems}
      />
    </div>
  );
}
