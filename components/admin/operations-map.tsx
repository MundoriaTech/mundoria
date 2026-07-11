"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

import type { AdminBooking } from "@/types/admin";

export function OperationsMap({ bookings }: { bookings: AdminBooking[] }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!key) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Configure Google Maps to enable the operations monitor.
      </div>
    );
  }
  return <LoadedMap apiKey={key} bookings={bookings} />;
}

function LoadedMap({
  apiKey,
  bookings,
}: {
  apiKey: string;
  bookings: AdminBooking[];
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "cleanscape-google-maps",
    libraries: ["places"],
  });
  if (!isLoaded) return <div className="h-96 rounded-xl bg-muted" />;
  const center = { lat: 51.5074, lng: -0.1278 };
  return (
    <GoogleMap
      center={center}
      mapContainerClassName="h-96 rounded-xl"
      options={{ mapTypeControl: false, streetViewControl: false }}
      zoom={10}
    >
      {bookings.map((booking) => {
        const lat =
          booking.status === "cleaner_en_route"
            ? booking.cleaner_live_latitude
            : booking.address?.latitude;
        const lng =
          booking.status === "cleaner_en_route"
            ? booking.cleaner_live_longitude
            : booking.address?.longitude;
        if (lat == null || lng == null) return null;
        const color =
          booking.status === "pending_match"
            ? "#F59E0B"
            : booking.status === "cleaner_en_route"
              ? "#2563EB"
              : "#16A34A";
        return (
          <MarkerF
            icon={{
              fillColor: color,
              fillOpacity: 1,
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            key={booking.id}
            position={{ lat: Number(lat), lng: Number(lng) }}
            title={`${booking.status}: ${booking.id.slice(0, 8)}`}
          />
        );
      })}
    </GoogleMap>
  );
}
