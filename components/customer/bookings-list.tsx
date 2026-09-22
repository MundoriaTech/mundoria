"use client";

import Link from "next/link";
import { useState } from "react";

import { BookingCard } from "@/components/customer/booking-card";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/customer";

type BookingsTab = "upcoming" | "past" | "cancelled";

const TABS: Array<{ id: BookingsTab; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
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
  const filtered = bookings.filter((booking) => {
    if (tab === "cancelled") return booking.status === "cancelled";
    if (tab === "past") return booking.status === "completed";
    return !["completed", "cancelled"].includes(booking.status);
  });
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    filtered,
    PAGE_SIZES.app,
    tab,
  );

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;

  return (
    <div>
      <div className="flex gap-1 border-b border-[#ece8f3] dark:border-border">
        {TABS.map((item) => {
          const label =
            item.id === "cancelled" && cancelledCount > 0
              ? `Cancelled (${cancelledCount})`
              : item.label;
          const active = tab === item.id;
          return (
            <button
              className={cn(
                "relative px-3 pb-3 pt-1 text-sm font-semibold transition sm:px-4",
                active
                  ? "text-[#1c133b] dark:text-foreground"
                  : "text-[#8b8798] hover:text-[#5a5470]",
              )}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {label}
              {active ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#d4694a] sm:inset-x-4" />
              ) : null}
            </button>
          );
        })}
      </div>

      {filtered.length ? (
        <>
          <ul className="mt-1">
            {pageItems.map((booking) => (
              <BookingCard
                booking={booking}
                key={booking.id}
                showRebook={tab === "past" || tab === "cancelled"}
              />
            ))}
          </ul>
          <ClientPagination
            className="mt-6"
            onPageChange={setPage}
            page={page}
            pageSize={PAGE_SIZES.app}
            totalItems={totalItems}
          />
        </>
      ) : (
        <div className="mt-10 px-2 py-12 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Sessions
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b] dark:text-foreground">
            {tab === "cancelled"
              ? "No cancelled sessions"
              : tab === "past"
                ? "No completed sessions"
                : "Nothing scheduled"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-6 text-[#5a5470] dark:text-muted-foreground">
            {tab === "cancelled"
              ? "Cancelled sessions will show here."
              : tab === "past"
                ? "Completed cleans will show here."
                : "Book a clean and your upcoming sessions will appear here."}
          </p>
          {tab === "upcoming" ? (
            <Link
              className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
              href="/booking/new?fresh=1&returnTo=/bookings"
            >
              Book a session
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
