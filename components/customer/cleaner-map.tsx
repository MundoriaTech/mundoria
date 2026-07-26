"use client";

import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";

export function CleanerMap({
  cleaner,
  destination,
}: {
  cleaner: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  return (
    <GeoapifyMapView
      center={cleaner}
      markers={[
        {
          color: "#2563eb",
          id: "cleaner",
          label: "Cleaner",
          position: cleaner,
          title: "Cleaner",
        },
        {
          color: "#16a34a",
          id: "destination",
          label: "You",
          position: destination,
          title: "Your address",
        },
      ]}
    />
  );
}
