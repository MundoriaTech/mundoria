"use client";

import {
  Camera,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import { createBrowserClient } from "@/lib/supabase/client";
import type { CleanerJob } from "@/types/cleaner";

export function JobDetail({ initialJob }: { initialJob: CleanerJob }) {
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [overrideCoords, setOverrideCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (job.status !== "cleaner_en_route" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (position) => {
        void fetch(`/api/bookings/${job.id}/location`, {
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [job.id, job.status]);

  async function action(
    value: "en_route" | "checkin" | "checkout" | "override",
  ) {
    setWorking(true);
    setError(null);
    let latitude = overrideCoords?.latitude;
    let longitude = overrideCoords?.longitude;
    if (value !== "en_route" && !overrideCoords) {
      try {
        const coords = await new Promise<GeolocationCoordinates>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position.coords),
              reject,
              { enableHighAccuracy: true },
            ),
        );
        latitude = coords.latitude;
        longitude = coords.longitude;
      } catch {
        setError("Enable location access to continue.");
        setWorking(false);
        return;
      }
    }
    const geofence = value === "checkin" || value === "checkout";
    const path = geofence
      ? `/api/bookings/${job.id}/${value}`
      : `/api/cleaner/jobs/${job.id}/action`;
    const response = await fetch(path, {
      body: JSON.stringify(
        geofence
          ? { latitude, longitude }
          : {
              action: value,
              latitude,
              longitude,
              reason:
                value === "override"
                  ? "Cleaner requested manual location review"
                  : undefined,
            },
      ),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      canRequestOverride?: boolean;
      error?: string;
    };
    setWorking(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to update job.");
      if (
        (result.canRequestOverride || response.status === 422) &&
        latitude !== undefined &&
        longitude !== undefined
      ) {
        setOverrideCoords({ latitude, longitude });
      }
      return;
    }
    if (value === "override") {
      setError("Manual override requested. An admin will review your location.");
      setOverrideCoords(null);
      return;
    }
    setJob((current) => ({
      ...current,
      checkin_verified: value === "checkin" || current.checkin_verified,
      checkout_verified: value === "checkout",
      status:
        value === "en_route"
          ? "cleaner_en_route"
          : value === "checkin"
            ? "in_progress"
            : "completed",
    }));
    router.refresh();
  }

  async function photo(file: File) {
    const supabase = createBrowserClient();
    const path = `${job.cleaner_id}/${job.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("booking-photos")
      .upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    await supabase.from("booking_photos").insert({
      area_label: "Completion",
      booking_id: job.id,
      cleaner_id: job.cleaner_id,
      photo_url: path,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Job #{job.id.slice(0, 8)}</p>
          <h1 className="text-3xl font-semibold">
            {formatServiceName(job.service_type)}
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/cleaner/messages/${job.id}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Message customer
          </Link>
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Job details</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p><b>Customer:</b> {job.customer?.full_name}</p>
            <p><b>Standard:</b> {standardLabel(job.cleaning_standard ?? "enhanced")}</p>
            <p><b>When:</b> {job.scheduled_date} at {job.scheduled_start_time.slice(0, 5)}</p>
            <p><b>Address:</b> {job.address?.address_line_1}, {job.address?.city}, {job.address?.postcode}</p>
            {job.special_attention_areas?.length ? (
              <p><b>Special attention:</b> {job.special_attention_areas.join(", ")}</p>
            ) : null}
            {job.add_ons?.length ? (
              <p>
                <b>Add-ons:</b>{" "}
                {job.add_ons.map((addOn) => addOn.label).join(", ")}
              </p>
            ) : null}
            <p><b>Instructions:</b> {job.special_instructions ?? "None"}</p>
            <p><b>Your earnings:</b> {formatMoney(job.amount_cleaner)}</p>
          </div>
        </section>
        <RouteMap job={job} />
      </div>
      {error ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-2"><ShieldAlert className="h-5 w-5" />{error}</div>
          {overrideCoords ? (
            <Button
              className="mt-3"
              onClick={() => void action("override")}
              size="sm"
              variant="outline"
            >
              Request manual override
            </Button>
          ) : null}
        </div>
      ) : null}
      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Job actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {["matched", "confirmed"].includes(job.status) ? (
            <Button disabled={working} onClick={() => void action("en_route")}>
              <Navigation className="mr-2 h-4 w-4" />I&apos;m On My Way
            </Button>
          ) : null}
          {job.status === "cleaner_en_route" ? (
            <Button disabled={working} onClick={() => void action("checkin")}>
              <MapPin className="mr-2 h-4 w-4" />Check In
            </Button>
          ) : null}
          {job.status === "in_progress" ? (
            <>
              <label>
                <Button asChild variant="outline">
                  <span><Camera className="mr-2 h-4 w-4" />Upload Photos</span>
                </Button>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void photo(file);
                  }}
                  type="file"
                />
              </label>
              <Button disabled={working} onClick={() => void action("checkout")}>
                Check Out & Complete
              </Button>
            </>
          ) : null}
          {job.status === "awaiting_customer_confirmation" ? (
            <p className="font-medium text-primary">
              Job marked complete. Waiting for customer checklist confirmation.
            </p>
          ) : null}
          {job.status === "completed" ? (
            <p className="font-medium text-primary">
              Job completed and payment captured.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function RouteMap({ job }: { job: CleanerJob }) {
  if (job.address?.latitude == null || job.address.longitude == null) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Map unavailable for this address.
      </div>
    );
  }
  const position = {
    lat: Number(job.address.latitude),
    lng: Number(job.address.longitude),
  };

  return (
    <GeoapifyMapView
      center={position}
      className="h-64"
      markers={[
        {
          color: "#047857",
          id: "job-address",
          position,
          title: `${job.address.address_line_1}, ${job.address.postcode}`,
        },
      ]}
      zoom={14}
    />
  );
}
