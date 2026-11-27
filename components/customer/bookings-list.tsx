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
    <div className="flex flex-col gap-4 rounded-[18px] bg-white p-5">
      {/* Tabs */}
      <div className="flex h-[46px] items-center gap-1 overflow-x-auto rounded-full bg-[#E7E7EF] px-[5px]">
        {TABS.map((t) => {
          const count = counts[t.id];
          const active = tab === t.id;
          return (
            <button
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full text-[14.5px] font-semibold transition-colors"
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                height: "36px",
                padding: "0 16px",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                background: active ? "#524096" : "transparent",
                color: active ? "#FFFFFF" : "#524096",
              }}
              type="button"
            >
              {t.label}
              {count > 0 && (
                <span
                  className="rounded-full"
                  style={{
                    padding: "1px 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: active ? "rgba(255,255,255,0.25)" : "rgba(82,64,150,0.15)",
                    color: active ? "#FFFFFF" : "#524096",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
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
        <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-14 text-center">
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
            {tab === "cancelled" ? "No cancelled sessions" : tab === "past" ? "No completed sessions" : tab === "ongoing" ? "Nothing happening right now" : "Nothing scheduled yet"}
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
              style={{ height: "48px", padding: "0 24px", fontSize: "15px", background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)", textDecoration: "none" }}
            >
              Book a session
            </CrmLink>
          )}
        </div>
      )}
    </div>
  );
}
