"use client";

import { GoogleMapView } from "@/components/shared/google-map-view";

export function CleanerMap({
  cleaner,
  destination,
}: {
  cleaner: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  return (
    <GoogleMapView
      center={cleaner}
      markers={[
        { id: "cleaner", label: "Cleaner", position: cleaner },
        { id: "destination", label: "You", position: destination },
      ]}
    />
  );
}
