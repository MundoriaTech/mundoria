"use client";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  getGeoapifyApiKey,
  getGeoapifyMapStyleUrl,
} from "@/lib/maps/geoapify";
import { cn } from "@/lib/utils";

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface GeoapifyMapMarker {
  color?: string;
  id?: string;
  label?: string;
  position: MapCoordinates;
  title?: string;
}

export interface GeoapifyMapCircle {
  center: MapCoordinates;
  color?: string;
  id?: string;
  radiusMeters: number;
}

export function GeoapifyMapView({
  center,
  circles = [],
  className,
  line = [],
  markers,
  zoom = 13,
}: {
  center: MapCoordinates;
  circles?: GeoapifyMapCircle[];
  className?: string;
  line?: MapCoordinates[];
  markers: GeoapifyMapMarker[];
  zoom?: number;
}) {
  const apiKey = getGeoapifyApiKey();

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Map unavailable. Add NEXT_PUBLIC_GEOAPIFY_API_KEY to enable it.
      </div>
    );
  }

  return (
    <LoadedGeoapifyMapView
      apiKey={apiKey}
      center={center}
      circles={circles}
      className={className}
      line={line}
      markers={markers}
      zoom={zoom}
    />
  );
}

function LoadedGeoapifyMapView({
  apiKey,
  center,
  circles,
  className,
  line,
  markers,
  zoom,
}: {
  apiKey: string;
  center: MapCoordinates;
  circles: GeoapifyMapCircle[];
  className?: string;
  line: MapCoordinates[];
  markers: GeoapifyMapMarker[];
  zoom: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const sourceId = useMemo(
    () => `cleanscape-overlays-${Math.random().toString(36).slice(2)}`,
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      center: [center.lng, center.lat],
      container: containerRef.current,
      style: getGeoapifyMapStyleUrl(apiKey),
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.once("load", () => setMapReady(true));
    mapRef.current = map;

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [apiKey, center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((marker) =>
      new maplibregl.Marker({
        color: marker.color ?? "#047857",
      })
        .setLngLat([marker.position.lng, marker.position.lat])
        .setPopup(
          marker.title || marker.label
            ? new maplibregl.Popup({ offset: 24 }).setText(
                marker.title ?? marker.label ?? "",
              )
            : undefined,
        )
        .addTo(map),
    );

    map.easeTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, markers, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateOverlays = () => {
      const data = createOverlayGeoJson(circles, line);

      if (map.getSource(sourceId)) {
        (
          map.getSource(sourceId) as maplibregl.GeoJSONSource
        ).setData(data);
        return;
      }

      map.addSource(sourceId, { data, type: "geojson" });
      map.addLayer({
        filter: ["==", ["get", "kind"], "circle"],
        id: `${sourceId}-circle-fill`,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.16,
        },
        source: sourceId,
        type: "fill",
      });
      map.addLayer({
        filter: ["==", ["get", "kind"], "circle"],
        id: `${sourceId}-circle-stroke`,
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
        },
        source: sourceId,
        type: "line",
      });
      map.addLayer({
        filter: ["==", ["get", "kind"], "line"],
        id: `${sourceId}-line`,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 4,
        },
        source: sourceId,
        type: "line",
      });
    };

    if (map.isStyleLoaded()) {
      updateOverlays();
      return;
    }

    map.once("load", updateOverlays);
    return () => {
      map.off("load", updateOverlays);
    };
  }, [circles, line, sourceId]);

  return (
    <div
      className={cn(
        "relative h-64 w-full overflow-hidden rounded-xl bg-muted",
        className,
      )}
      ref={containerRef}
    >
      {!mapReady ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner label="Loading map" />
        </div>
      ) : null}
    </div>
  );
}

function createOverlayGeoJson(
  circles: GeoapifyMapCircle[],
  line: MapCoordinates[],
) {
  return {
    features: [
      ...circles.map((circle) => ({
        geometry: {
          coordinates: [
            createCirclePolygon(circle.center, circle.radiusMeters),
          ],
          type: "Polygon" as const,
        },
        properties: {
          color: circle.color ?? "#059669",
          kind: "circle",
        },
        type: "Feature" as const,
      })),
      ...(line.length > 1
        ? [
            {
              geometry: {
                coordinates: line.map((point) => [point.lng, point.lat]),
                type: "LineString" as const,
              },
              properties: { kind: "line" },
              type: "Feature" as const,
            },
          ]
        : []),
    ],
    type: "FeatureCollection" as const,
  };
}

function createCirclePolygon(center: MapCoordinates, radiusMeters: number) {
  const points = 64;
  const earthRadius = 6_371_000;
  const latRadians = toRadians(center.lat);
  const lngRadians = toRadians(center.lng);
  const distance = radiusMeters / earthRadius;

  return Array.from({ length: points + 1 }, (_, index) => {
    const bearing = (2 * Math.PI * index) / points;
    const lat = Math.asin(
      Math.sin(latRadians) * Math.cos(distance) +
        Math.cos(latRadians) * Math.sin(distance) * Math.cos(bearing),
    );
    const lng =
      lngRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(latRadians),
        Math.cos(distance) - Math.sin(latRadians) * Math.sin(lat),
      );

    return [toDegrees(lng), toDegrees(lat)];
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}
