"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

const libraries: "places"[] = ["places"];

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface GoogleMapMarker {
  id?: string;
  label?: string;
  position: MapCoordinates;
  title?: string;
}

export function GoogleMapView({
  center,
  className,
  markers,
  zoom = 13,
}: {
  center: MapCoordinates;
  className?: string;
  markers: GoogleMapMarker[];
  zoom?: number;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Map unavailable. Configure the Google Maps API key to enable it.
      </div>
    );
  }
  return (
    <LoadedGoogleMapView
      apiKey={apiKey}
      center={center}
      className={className}
      markers={markers}
      zoom={zoom}
    />
  );
}

function LoadedGoogleMapView({
  apiKey,
  center,
  className,
  markers,
  zoom,
}: {
  apiKey: string;
  center: MapCoordinates;
  className?: string;
  markers: GoogleMapMarker[];
  zoom: number;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "cleanscape-google-maps",
    libraries,
  });

  if (loadError) {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        The map could not be loaded.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl bg-muted",
          className,
        )}
      >
        <LoadingSpinner label="Loading map" />
      </div>
    );
  }

  return (
    <GoogleMap
      center={center}
      mapContainerClassName={cn("h-64 w-full rounded-xl", className)}
      options={{
        disableDefaultUI: true,
        fullscreenControl: true,
        zoomControl: true,
      }}
      zoom={zoom}
    >
      {markers.map((marker, index) => (
        <MarkerF
          key={marker.id ?? `${marker.position.lat}-${marker.position.lng}-${index}`}
          label={marker.label}
          position={marker.position}
          title={marker.title}
        />
      ))}
    </GoogleMap>
  );
}
