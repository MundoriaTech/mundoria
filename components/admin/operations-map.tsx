"use client";

import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { LONDON_CENTER } from "@/lib/maps/geoapify";
import type { AdminBooking } from "@/types/admin";

export function OperationsMap({ bookings }: { bookings: AdminBooking[] }) {
  return (
    <GeoapifyMapView
      center={LONDON_CENTER}
      className="h-64 sm:h-96"
      markers={bookings.flatMap((booking) => {
        const lat =
          booking.status === "cleaner_en_route"
            ? booking.cleaner_live_latitude
            : booking.address?.latitude;
        const lng =
          booking.status === "cleaner_en_route"
            ? booking.cleaner_live_longitude
            : booking.address?.longitude;

        if (lat == null || lng == null) return [];

        const color =
          booking.status === "pending_match"
            ? "#F59E0B"
            : booking.status === "cleaner_en_route"
              ? "#2563EB"
              : "#16A34A";

        return [
          {
            color,
            id: booking.id,
            position: { lat: Number(lat), lng: Number(lng) },
            title: `${booking.status}: ${booking.id.slice(0, 8)}`,
          },
        ];
      })}
      zoom={10}
    />
  );
}
