"use client";

import { useState } from "react";

import { BookingCard } from "@/components/customer/booking-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/customer";

type BookingsTab = "upcoming" | "past" | "cancelled";

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
      <div className="mb-6 inline-flex max-w-full flex-wrap rounded-full bg-[#f3eef8] p-1">
        {(
          [
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Completed" },
            {
              id: "cancelled",
              label:
                cancelledCount > 0
                  ? `Cancelled (${cancelledCount})`
                  : "Cancelled",
            },
          ] as const
        ).map((item) => (
          <Button
            className={cn(
              "rounded-full",
              tab === item.id ? undefined : "text-[#5a5470]",
            )}
            key={item.id}
            onClick={() => setTab(item.id)}
            size="sm"
            variant={tab === item.id ? "default" : "ghost"}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {filtered.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {pageItems.map((booking) => (
              <BookingCard
                booking={booking}
                key={booking.id}
                showRebook={tab === "past" || tab === "cancelled"}
              />
            ))}
          </div>
          <ClientPagination
            className="mt-6"
            onPageChange={setPage}
            page={page}
            pageSize={PAGE_SIZES.app}
            totalItems={totalItems}
          />
        </>
      ) : (
        <EmptyState
          message={
            tab === "cancelled"
              ? "Cancelled sessions will show here."
              : tab === "past"
                ? "Completed cleans will show here."
                : "No upcoming sessions yet."
          }
          title={
            tab === "cancelled"
              ? "No cancelled sessions"
              : tab === "past"
                ? "No completed sessions"
                : "Nothing scheduled"
          }
        />
      )}
    </div>
  );
}
