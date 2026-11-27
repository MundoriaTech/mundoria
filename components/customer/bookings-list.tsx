"use client";

import { ONGOING_STATUSES } from "@/lib/customer/session-tabs";
import { useState } from "react";

import { CrmLink } from "@/components/analytics/crm-link";
import { BookingCard } from "@/components/customer/booking-card";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";
import type { Booking } from "@/types/customer";

type BookingsTab = "upcoming" | "ongoing" | "past" | "cancelled";

function tabFor(status: string): BookingsTab {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "past";
  if (ONGOING_STATUSES.includes(status)) return "ongoing";
  return "upcoming";
}

const TABS: Array<{ id: BookingsTab; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export function BookingsList({
  bookings,
  initialTab = "upcoming",
}: {
  bookings: Booking[];
  initialTab?: BookingsTab;
}) {
  const [tab, setTab] = useState<BookingsTab>(initialTab);

  const filtered = bookings.filter((b) => tabFor(b.status) === tab);

  const { page, pageItems, setPage, totalItems } = usePagedItems(filtered, PAGE_SIZES.app, tab);

  const countOf = (id: BookingsTab) => bookings.filter((b) => tabFor(b.status) === id).length;

  const counts: Record<BookingsTab, number> = {
    cancelled: countOf("cancelled"),
    ongoing: countOf("ongoing"),
    past: countOf("past"),
    upcoming: countOf("upcoming"),
  };

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-3.5 sm:gap-4 sm:p-5">
      <div
        aria-label="Session filters"
        className="grid grid-cols-4 gap-1 rounded-[12px] bg-[#E7E7EF] p-1"
        role="tablist"
      >
        {TABS.map((t) => {
          const count = counts[t.id];
          const active = tab === t.id;
          return (
            <button
              aria-selected={active}
              className="relative flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[9px] px-1 transition-colors sm:h-9 sm:flex-row sm:gap-1.5 sm:px-2"
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              style={{
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                background: active ? "#524096" : "transparent",
                color: active ? "#FFFFFF" : "#524096",
              }}
              type="button"
            >
              <span className="truncate text-[11.5px] font-semibold leading-none sm:text-[14.5px]">
                {t.label}
              </span>
              {count > 0 ? (
                <span
                  className="rounded-md"
                  style={{
                    padding: "0 5px",
                    fontSize: "10px",
                    fontWeight: 700,
                    lineHeight: "15px",
                    background: active
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(82,64,150,0.14)",
                    color: active ? "#FFFFFF" : "#524096",
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {pageItems.length > 0 ? (
        <>
          <ul className="m-0 list-none p-0">
            {pageItems.map((booking) => (
              <BookingCard
                booking={booking}
                key={booking.id}
                showRebook={tab === "past" || tab === "cancelled"}
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
        <div className="rounded-[14px] bg-[#F3F4F6] px-4 py-10 text-center sm:px-5 sm:py-14">
          <div
            className="mx-auto mb-4 flex items-center justify-center rounded-full bg-[#EAE7F5]"
            style={{ width: "56px", height: "56px" }}
          >
            <svg fill="none" height={26} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={26}>
              <rect height="18" rx="2" width="18" x="3" y="4" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p style={{ fontSize: "17.4px", fontWeight: 700, color: "#1E1848", margin: 0 }}>
            {tab === "cancelled"
              ? "No cancelled sessions"
              : tab === "past"
                ? "No completed sessions"
                : tab === "ongoing"
                  ? "Nothing happening right now"
                  : "Nothing scheduled yet"}
          </p>
          <p style={{ fontSize: "14.5px", color: "#6B6B70", marginTop: "6px" }}>
            {tab === "cancelled"
              ? "Cancelled sessions will appear here."
              : tab === "past"
                ? "Completed cleans will appear here."
                : tab === "ongoing"
                  ? "When your cleaner is on the way or cleaning, the visit shows here."
                  : "Book your first clean and your sessions will appear here."}
          </p>
          {tab === "upcoming" && (
            <CrmLink
              className="mt-5 inline-flex items-center gap-2 rounded-full font-semibold text-white transition"
              crmEvent="book_session_click"
              crmPayload={{ action: "Book a session" }}
              href="/booking/new?fresh=1&returnTo=/bookings"
              style={{
                height: "48px",
                padding: "0 24px",
                fontSize: "15px",
                background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                textDecoration: "none",
              }}
            >
              Book a session
            </CrmLink>
          )}
        </div>
      )}
    </div>
  );
}
