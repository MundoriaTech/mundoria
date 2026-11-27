"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
import type { CleanerJob } from "@/types/cleaner";

type JobsTab = "available" | "upcoming" | "ongoing" | "past" | "cancelled";

const ONGOING = [
  "cleaner_en_route",
  "in_progress",
  "awaiting_customer_confirmation",
  "disputed",
];

const TABS: Array<{ id: JobsTab; label: string }> = [
  { id: "available", label: "Available" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  pending_match: { bg: "#FFF5E6", color: "#C17E24", label: "Open offer" },
  matched: { bg: "#FFF5E6", color: "#C17E24", label: "Offer" },
  awaiting_payment: { bg: "#EAE7F5", color: "#524096", label: "Confirming pay" },
  confirmed: { bg: "#EAE7F5", color: "#524096", label: "Confirmed" },
  cleaner_en_route: { bg: "#E8F0FF", color: "#2D5BE3", label: "En route" },
  in_progress: { bg: "#E0F4EB", color: "#1A7A4A", label: "In progress" },
  awaiting_customer_confirmation: {
    bg: "#E0F4EB",
    color: "#1A7A4A",
    label: "Awaiting confirm",
  },
  completed: { bg: "#E0F4EB", color: "#1A7A4A", label: "Completed" },
  cancelled: { bg: "#F0F0F0", color: "#6B6B70", label: "Cancelled" },
  no_show: { bg: "#FEE9E9", color: "#C0272D", label: "No show" },
  disputed: { bg: "#FEE9E9", color: "#C0272D", label: "Disputed" },
};

function isTeamSlot(job: CleanerJob) {
  return (
    Number(job.allocated_cleaners ?? 1) > 1 &&
    Boolean(job.cleaner_id) &&
    ["matched", "awaiting_payment", "confirmed"].includes(job.status)
  );
}

function jobTab(job: CleanerJob, availableIds: Set<string>): JobsTab | null {
  if (availableIds.has(job.id)) return "available";
  if (job.status === "cancelled" || job.status === "no_show") return "cancelled";
  if (job.status === "completed") return "past";
  if (ONGOING.includes(job.status)) return "ongoing";
  if (!["completed", "cancelled", "no_show"].includes(job.status)) {
    return "upcoming";
  }
  return null;
}

export function JobFeed({
  available,
  assigned,
  initialTab = "available",
}: {
  available: CleanerJob[];
  assigned: CleanerJob[];
  initialTab?: JobsTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<JobsTab>(initialTab);
  const [now, setNow] = useState(Date.now());
  const [warning, setWarning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const availableIds = useMemo(
    () => new Set(available.map((job) => job.id)),
    [available],
  );

  const jobs = useMemo(() => {
    if (tab === "available") return available;
    return assigned.filter((job) => jobTab(job, availableIds) === tab);
  }, [assigned, available, availableIds, tab]);

  const { page, pageItems, setPage, totalItems } = usePagedItems(
    jobs,
    PAGE_SIZES.app,
    tab,
  );

  const counts: Record<JobsTab, number> = {
    available: available.length,
    cancelled: assigned.filter((j) => jobTab(j, availableIds) === "cancelled")
      .length,
    ongoing: assigned.filter((j) => jobTab(j, availableIds) === "ongoing")
      .length,
    past: assigned.filter((j) => jobTab(j, availableIds) === "past").length,
    upcoming: assigned.filter((j) => jobTab(j, availableIds) === "upcoming")
      .length,
  };

  async function respond(id: string, response: "accepted" | "declined") {
    setBusyId(id);
    const res = await fetch(`/api/cleaner/jobs/${id}/respond`, {
      body: JSON.stringify({ response }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    if (res.ok) {
      if (response === "accepted") router.push(`/cleaner/job/${id}`);
      else {
        setWarning(true);
        router.refresh();
      }
    }
  }

  async function claimTeam(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/cleaner/jobs/${id}/claim-team`, {
      method: "POST",
    });
    setBusyId(null);
    if (res.ok) router.push(`/cleaner/job/${id}`);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-3.5 sm:gap-4 sm:p-5">
      <div
        aria-label="Job filters"
        className="grid grid-cols-5 gap-1 rounded-[12px] bg-[#E7E7EF] p-1"
        role="tablist"
      >
        {TABS.map((t) => {
          const count = counts[t.id];
          const active = tab === t.id;
          return (
            <button
              aria-selected={active}
              className="relative flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[9px] px-0.5 transition-colors sm:h-9 sm:flex-row sm:gap-1 sm:px-1.5"
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              style={{
                background: active ? "#524096" : "transparent",
                border: "none",
                color: active ? "#FFFFFF" : "#524096",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              type="button"
            >
              <span className="truncate text-[10.5px] font-semibold leading-none sm:text-[13.5px]">
                {t.label}
              </span>
              {count > 0 ? (
                <span
                  className="rounded-md"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(82,64,150,0.14)",
                    color: active ? "#FFFFFF" : "#524096",
                    fontSize: "10px",
                    fontWeight: 700,
                    lineHeight: "15px",
                    padding: "0 5px",
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {warning ? (
        <div className="flex gap-2 rounded-[14px] bg-[#FFF5E6] px-3.5 py-3 text-[13.5px] text-[#8A5200]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Repeated declines affect your reliability score.
        </div>
      ) : null}

      {pageItems.length > 0 ? (
        <>
          <ul className="m-0 list-none p-0">
            {pageItems.map((job) => (
              <JobRow
                busy={busyId === job.id}
                job={job}
                key={job.id}
                now={now}
                onAccept={() => void respond(job.id, "accepted")}
                onClaim={() => void claimTeam(job.id)}
                onDecline={() => void respond(job.id, "declined")}
                tab={tab}
              />
            ))}
          </ul>
          <ClientPagination
            onPageChange={setPage}
            page={page}
            pageSize={PAGE_SIZES.app}
            totalItems={totalItems}
          />
        </>
      ) : (
        <EmptyState tab={tab} />
      )}
    </div>
  );
}

function JobRow({
  busy,
  job,
  now,
  onAccept,
  onClaim,
  onDecline,
  tab,
}: {
  busy: boolean;
  job: CleanerJob;
  now: number;
  onAccept: () => void;
  onClaim: () => void;
  onDecline: () => void;
  tab: JobsTab;
}) {
  const when = new Date(`${job.scheduled_date}T${job.scheduled_start_time}`);
  const day = when.toLocaleDateString("en-GB", { day: "numeric" });
  const month = when.toLocaleDateString("en-GB", { month: "short" });
  const weekday = when.toLocaleDateString("en-GB", { weekday: "short" });
  const hours = parseInt(job.scheduled_start_time.split(":")[0] ?? "0", 10);
  const mins = job.scheduled_start_time.split(":")[1] ?? "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeFormatted = `${h12}:${mins} ${ampm}`;

  const teamSlot = tab === "available" && isTeamSlot(job);
  const share =
    teamSlot && job.amount_cleaner && job.allocated_cleaners
      ? Math.floor(job.amount_cleaner / job.allocated_cleaners)
      : job.amount_cleaner;
  const expires = job.offer_expires_at
    ? new Date(job.offer_expires_at).getTime()
    : new Date(job.created_at).getTime() + 30 * 60 * 1000;
  const remaining = Math.max(0, expires - now);
  const closed = remaining === 0;

  const borough =
    job.address?.city ?? job.address?.postcode?.split(" ")[0] ?? "Local area";
  const place =
    tab === "available"
      ? borough
      : [job.address?.address_line_1, borough].filter(Boolean).join(", ");

  const pill = teamSlot
    ? { bg: "#EAE7F5", color: "#524096", label: "Team slot" }
    : tab === "available"
      ? {
          bg: closed ? "#F0F0F0" : "#FFF5E6",
          color: closed ? "#6B6B70" : "#C17E24",
          label: closed
            ? "Closed"
            : `${Math.floor(remaining / 60000)}:${String(
                Math.floor((remaining % 60000) / 1000),
              ).padStart(2, "0")}`,
        }
      : (STATUS_PILL[job.status] ?? STATUS_PILL.cancelled!);

  const showActions = tab === "available";

  return (
    <li className="mb-[6px] list-none">
      <div className="group flex flex-col overflow-hidden rounded-[14px] bg-[#F3F4F6] transition-colors hover:bg-white hover:shadow-sm sm:flex-row sm:items-stretch">
        <Link
          className="flex min-w-0 flex-1 items-start gap-3 p-3.5 no-underline sm:items-center sm:gap-4 sm:p-4"
          href={`/cleaner/job/${job.id}`}
        >
          <div className="flex h-[52px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-white px-1 py-1.5 sm:h-auto sm:min-h-[56px] sm:w-[52px]">
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

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[14.5px] font-bold leading-snug text-[#1E1848] sm:text-[15px]">
                {bookingServiceName(job)}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full"
                style={{
                  background: pill.bg,
                  color: pill.color,
                  fontSize: "12px",
                  fontWeight: 600,
                  height: "24px",
                  padding: "0 10px",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="shrink-0 rounded-full"
                  style={{
                    background: pill.color,
                    height: "5px",
                    width: "5px",
                  }}
                />
                {pill.label}
              </span>
            </div>
            <p className="m-0 mt-1 truncate text-[13px] text-[#5F5F66] sm:text-[13.5px]">
              {timeFormatted}
              {place ? ` · ${place}` : ""}
            </p>
            {share ? (
              <p className="m-0 mt-1 text-[14px] font-bold text-[#524096] sm:text-[14.5px]">
                {formatMoney(share)}
                {teamSlot ? " your share" : ""}
              </p>
            ) : null}
          </div>

          {!showActions ? (
            <ChevronRight
              className="mt-1.5 shrink-0 sm:ml-2 sm:mt-0"
              style={{ color: "#C4BFD4", height: "18px", width: "18px" }}
            />
          ) : null}
        </Link>

        {showActions ? (
          <div className="flex flex-wrap gap-2 border-t border-black/[0.04] px-3.5 pb-3.5 pt-0 sm:items-center sm:border-t-0 sm:p-0 sm:pr-4">
            {teamSlot ? (
              <button
                className="inline-flex h-9 w-full items-center justify-center rounded-full px-3.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:w-auto"
                disabled={busy}
                onClick={onClaim}
                style={{
                  background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                }}
                type="button"
              >
                Claim slot
              </button>
            ) : (
              <>
                <button
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-full border-[1.5px] border-[#D4CCEA] bg-white px-3.5 text-[13px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6] disabled:opacity-50 sm:flex-none"
                  disabled={busy || closed}
                  onClick={onDecline}
                  type="button"
                >
                  Decline
                </button>
                <button
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:flex-none"
                  disabled={busy || closed}
                  onClick={onAccept}
                  style={{
                    background:
                      "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                  }}
                  type="button"
                >
                  Accept
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function EmptyState({ tab }: { tab: JobsTab }) {
  const copy =
    tab === "available"
      ? {
          body: "When Mundoria sends you an offer, it will show here with area, time and pay.",
          title: "No offers right now",
        }
      : tab === "ongoing"
        ? {
            body: "Jobs you are en route to or cleaning will show here.",
            title: "Nothing happening right now",
          }
        : tab === "past"
          ? {
              body: "Completed cleans will appear here with your earnings.",
              title: "No completed jobs",
            }
          : tab === "cancelled"
            ? {
                body: "Cancelled jobs will appear here.",
                title: "No cancelled jobs",
              }
            : {
                body: "Accepted jobs that are still ahead will show here.",
                title: "Nothing scheduled yet",
              };

  return (
    <div className="rounded-[14px] bg-[#F3F4F6] px-4 py-10 text-center sm:px-5 sm:py-14">
      <div
        className="mx-auto mb-4 flex items-center justify-center rounded-full bg-[#EAE7F5]"
        style={{ height: "56px", width: "56px" }}
      >
        <svg
          fill="none"
          height={26}
          stroke="#524096"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={26}
        >
          <rect height="18" rx="2" width="18" x="3" y="4" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
      <p className="m-0 text-[17px] font-bold text-[#1E1848]">{copy.title}</p>
      <p className="m-0 mt-1.5 text-[14.5px] text-[#6B6B70]">{copy.body}</p>
    </div>
  );
}
