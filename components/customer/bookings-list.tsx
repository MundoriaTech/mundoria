"use client";

import { useState } from "react";

import { BookingCard } from "@/components/customer/booking-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types/customer";

export function BookingsList({
  bookings,
  initialTab = "upcoming",
}: {
  bookings: Booking[];
  initialTab?: "upcoming" | "past";
}) {
  const [tab, setTab] = useState(initialTab);
  const filtered = bookings.filter((booking) =>
    tab === "past"
      ? ["completed", "cancelled"].includes(booking.status)
      : !["completed", "cancelled"].includes(booking.status),
  );

  return (
    <div>
      <div className="mb-6 inline-flex rounded-lg bg-muted p-1">
        <Button
          onClick={() => setTab("upcoming")}
          size="sm"
          variant={tab === "upcoming" ? "default" : "ghost"}
        >
          Upcoming
        </Button>
        <Button
          onClick={() => setTab("past")}
          size="sm"
          variant={tab === "past" ? "default" : "ghost"}
        >
          Past
        </Button>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking.id}
              showRebook={tab === "past"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          message={`No ${tab} bookings yet.`}
          title={tab === "past" ? "No booking history" : "Nothing scheduled"}
        />
      )}
    </div>
  );
}
