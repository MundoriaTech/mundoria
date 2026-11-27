"use client";

import {
  Camera,
  MapPin,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { JobBrief } from "@/components/cleaner/job-brief";
import {
  pillPrimaryStyle,
  SectionBanner,
  SectionHeading,
} from "@/components/customer/dashboard/section-banner";
import { useFeedback } from "@/components/shared/feedback-provider";
import { getCurrentCoords, locationErrorMessage } from "@/lib/geo/current-position";
import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { SafetyAlertSheet } from "@/components/shared/safety-alert-sheet";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { safetyAlertAllowed } from "@/lib/bookings/safety-alert-shared";
import { checkInWindowMessage, enRouteWindowMessage } from "@/lib/bookings/schedule";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import { createBrowserClient } from "@/lib/supabase/client";
import type { CleanerJob } from "@/types/cleaner";

const actionPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50";
const actionOutline =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#D4CCEA] bg-[#F3F4F6] px-5 text-[14px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6] disabled:opacity-50";
const actionDanger =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#F0C4B8] bg-white px-5 text-[14px] font-semibold text-[#9A2B18] transition hover:bg-[#fff7f2] disabled:opacity-50";

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  pending_match: { bg: "#FFF5E6", color: "#C17E24", label: "Open offer" },
  matched: { bg: "#FFF5E6", color: "#C17E24", label: "Offer" },
  awaiting_payment: { bg: "#EAE7F5", color: "#524096", label: "Confirming pay" },
  confirmed: { bg: "#EAE7F5", color: "#524096", label: "Confirmed" },
  cleaner_en_route: { bg: "#E8F0FF", color: "#2D5BE3", label: "En route" },
  in_progress: { bg: "#E0F4EB", color: "#1A7A4A", label: "In progress" },
  awaiting_customer_confirmation: {
    bg: "#E0F4EB",
    color: "#1A7A4A",
    label: "Awaiting confirm",
  },
  completed: { bg: "#E0F4EB", color: "#1A7A4A", label: "Completed" },
  cancelled: { bg: "#F0F0F0", color: "#6B6B70", label: "Cancelled" },
  no_show: { bg: "#FEE9E9", color: "#C0272D", label: "No show" },
  disputed: { bg: "#FEE9E9", color: "#C0272D", label: "Disputed" },
};

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

function CheckInAction({
  durationHours,
  onCheckIn,
  scheduledDate,
  scheduledStartTime,
  working,
}: {
  durationHours: number | null;
  onCheckIn: () => void;
  scheduledDate: string;
  scheduledStartTime: string;
  working: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const windowMessage = checkInWindowMessage({
    estimatedDurationHours: durationHours,
    now,
    scheduledDate,
    scheduledStartTime,
  });

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        className={`${actionPrimary} w-full`}
        disabled={working || Boolean(windowMessage)}
        onClick={onCheckIn}
        style={pillPrimaryStyle}
        type="button"
      >
        <MapPin className="h-4 w-4" strokeWidth={2} />
        I have arrived
      </button>
      {windowMessage ? (
        <p className="m-0 text-[13px] leading-5 text-[#5F5F66]">{windowMessage}</p>
      ) : null}
    </div>
  );
}

export function JobDetail({ initialJob }: { initialJob: CleanerJob }) {
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState<string | null>(null);
  const [locationProblem, setLocationProblem] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const enRouteMessage = enRouteWindowMessage({
    now: clockNow,
    scheduledDate: job.scheduled_date,
    scheduledStartTime: job.scheduled_start_time,
  });
  const [working, setWorking] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [overrideCoords, setOverrideCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const router = useRouter();
  const { confirm } = useFeedback();

  useEffect(() => {
    if (job.status !== "cleaner_en_route" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocationProblem(null);
        void fetch(`/api/bookings/${job.id}/location`, {
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      },
      (watchError) => setLocationProblem(locationErrorMessage(watchError)),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [job.id, job.status]);

  async function releaseJob() {
    const confirmed = await confirm({
      action: "Release job",
      description:
        "The job goes back to other cleaners and the customer is told. Releasing a job you've accepted counts as a cancellation on your record.",
      title: "Are you sure you want to release this job?",
      variant: "destructive",
    });
    if (confirmed) await respond("declined");
  }

  async function respond(response: "accepted" | "declined") {
    setWorking(true);
    setError(null);
    const res = await fetch(`/api/cleaner/jobs/${job.id}/respond`, {
      body: JSON.stringify({ response }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await res.json()) as { error?: string };
    setWorking(false);
    if (!res.ok) {
      setError(result.error ?? "Unable to answer this offer.");
      return;
    }
    if (response === "declined") {
      router.push("/cleaner/jobs");
      return;
    }
    setJob((current) => ({ ...current, status: "confirmed" }));
    router.refresh();
  }

  async function action(
    value: "en_route" | "checkin" | "checkout" | "override",
  ) {
    setWorking(true);
    setError(null);
    let latitude = overrideCoords?.latitude;
    let longitude = overrideCoords?.longitude;
    // A manual review is sent even without a location; everything else needs one.
    if (value !== "en_route" && value !== "override" && !overrideCoords) {
      try {
        const coords = await getCurrentCoords();
        latitude = coords.latitude;
        longitude = coords.longitude;
      } catch (locationError) {
        setError(
          locationError instanceof Error
            ? locationError.message
            : "We couldn't read your location. Check Location is on and try again.",
        );
        setLocationFailed(true);
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
      setLocationFailed(false);
      return;
    }
    setJob((current) => ({
      ...current,
      arrived_at:
        value === "checkin" ? new Date().toISOString() : current.arrived_at,
      checkin_verified: current.checkin_verified,
      checkout_verified: value === "checkout",
      status:
        value === "en_route" || value === "checkin"
          ? "cleaner_en_route"
          : "completed",
    }));
    router.refresh();
  }

  async function startCleaning() {
    setWorking(true);
    setError(null);
    const response = await fetch(`/api/bookings/${job.id}/start`, {
      body: JSON.stringify({ role: "cleaner" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      started?: boolean;
    };
    setWorking(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to start the clean.");
      return;
    }
    if (result.started) {
      setJob((current) => ({
        ...current,
        checkin_verified: true,
        status: "in_progress",
      }));
    } else {
      setError("Waiting for the customer to confirm they have let you in.");
    }
  }

  async function confirmGate(confirmed: boolean) {
    setWorking(true);
    setError(null);
    const response = await fetch(`/api/cleaner/jobs/${job.id}/confirm-gate`, {
      body: JSON.stringify({ confirmed }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setWorking(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to update confirmation.");
      return;
    }
    if (confirmed) {
      setJob((current) => ({
        ...current,
        confirmation_responded_at: new Date().toISOString(),
        status:
          current.confirmation_gate === "t1"
            ? "cleaner_en_route"
            : current.status,
      }));
    }
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

  const pill = STATUS_PILL[job.status] ?? STATUS_PILL.cancelled!;
  const when = new Date(`${job.scheduled_date}T${job.scheduled_start_time}`);
  const whenLabel = when.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = job.scheduled_start_time.slice(0, 5);
  const area =
    job.address?.city ?? job.address?.postcode?.split(" ")[0] ?? null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <SectionBanner title={bookingServiceName(job)}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {pill.label}
          </span>
        </SectionBanner>

        <p className="m-0 text-[14px] text-[#5F5F66]">
          {[whenLabel, timeLabel, area, `#${job.id.slice(0, 8)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[18px] bg-[#F3F4F6] p-5">
            <p className={tileLabel}>Your pay</p>
            <p className="m-0 mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#523F97]">
              {job.amount_cleaner ? formatMoney(job.amount_cleaner) : "TBC"}
            </p>
            <p className="m-0 mt-2 text-[13px] leading-5 text-[#5F5F66]">
              Paid after the visit into your next payout.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[18px] bg-[#F3F4F6] p-5">
            <p className={tileLabel}>Job actions</p>

            {job.status === "awaiting_payment" ? (
              <p className="m-0 text-[13px] leading-5 text-[#5F5F66]">
                You accepted this job. Mundoria is securing the customer
                payment before the visit is fully confirmed.
              </p>
            ) : null}
            {job.status === "confirmed" && enRouteMessage ? (
              <p className="m-0 text-[13px] leading-5 text-[#8A5200]">
                {enRouteMessage}
              </p>
            ) : null}
            {job.status === "awaiting_customer_confirmation" ? (
              <p className="m-0 text-[13px] font-semibold leading-5 text-[#524096]">
                Job marked complete. Waiting for customer checklist
                confirmation.
              </p>
            ) : null}
            {job.status === "completed" ? (
              <p className="m-0 text-[13px] font-semibold leading-5 text-[#1A7A4A]">
                Job completed and payment captured.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              {job.status === "matched" ? (
                <button
                  className={`${actionPrimary} w-full`}
                  disabled={working}
                  onClick={() => void respond("accepted")}
                  style={pillPrimaryStyle}
                  type="button"
                >
                  Accept job
                </button>
              ) : null}
              {job.status === "confirmed" ? (
                <button
                  className={`${actionPrimary} w-full`}
                  disabled={working || Boolean(enRouteMessage)}
                  onClick={() => void action("en_route")}
                  style={pillPrimaryStyle}
                  title={enRouteMessage ?? undefined}
                  type="button"
                >
                  <Navigation className="h-4 w-4" strokeWidth={2} />
                  I&apos;m on my way
                </button>
              ) : null}
              {job.status === "cleaner_en_route" && !job.arrived_at ? (
                <CheckInAction
                  durationHours={job.estimated_duration_hours}
                  scheduledDate={job.scheduled_date}
                  scheduledStartTime={job.scheduled_start_time}
                  working={working}
                  onCheckIn={() => void action("checkin")}
                />
              ) : null}
              {job.status === "cleaner_en_route" && job.arrived_at ? (
                <button
                  className={`${actionPrimary} w-full`}
                  disabled={working}
                  onClick={() => void startCleaning()}
                  style={pillPrimaryStyle}
                  type="button"
                >
                  Start cleaning
                </button>
              ) : null}
              {job.status === "in_progress" ? (
                <button
                  className={`${actionPrimary} w-full`}
                  disabled={working}
                  onClick={() => void action("checkout")}
                  style={pillPrimaryStyle}
                  type="button"
                >
                  Check out &amp; complete
                </button>
              ) : null}
              {job.status === "matched" ? (
                <button
                  className={`${actionOutline} w-full`}
                  disabled={working}
                  onClick={() => void respond("declined")}
                  type="button"
                >
                  Decline
                </button>
              ) : null}
              {job.status === "in_progress" ? (
                <label className={`${actionOutline} w-full cursor-pointer`}>
                  <Camera className="h-4 w-4" strokeWidth={2} />
                  Upload photos
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
              ) : null}
              {job.status === "confirmed" ||
              (job.status === "cleaner_en_route" && !job.checkin_verified) ? (
                <button
                  className="mt-1 self-start bg-transparent p-0 text-[13px] font-semibold text-[#9A2B18] underline underline-offset-2 transition hover:text-[#7A1F10] disabled:opacity-50"
                  disabled={working}
                  onClick={() => void releaseJob()}
                  type="button"
                >
                  Release this job
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[18px] bg-[#F3F4F6] p-5">
            <p className={tileLabel}>Customer</p>
            <div className="mt-3 flex items-center gap-3.5">
              <UserAvatar
                name={job.customer?.full_name}
                seed={job.customer_id}
                size="md"
                url={job.customer?.avatar_url}
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[15px] font-semibold text-[#1E1848]">
                  {job.customer?.full_name?.trim() || "Customer"}
                </p>
                <p className="m-0 mt-0.5 text-[13px] text-[#6B6B70]">
                  Message about access or timing
                </p>
              </div>
              {job.status !== "cancelled" ? (
                <Link
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#D4CCEA] bg-white px-3.5 text-[13px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6]"
                  href={`/cleaner/messages/${job.id}`}
                >
                  Message
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {job.safety_hold_at ? (
        <section className="rounded-[18px] bg-[#fff7f2] px-5 py-4 text-[14px] text-[#7a3b28]">
          <p className="m-0 font-semibold">Safety review in progress</p>
          <p className="m-0 mt-1.5 leading-5">
            This job is on hold. Leave if you feel unsafe. Call 999 if you are
            in danger. Check-in and completion stay paused until Mundoria clears
            the hold.
          </p>
        </section>
      ) : null}

      {job.confirmation_gate &&
      job.confirmation_gate !== "none" &&
      !job.confirmation_responded_at &&
      ["matched", "confirmed"].includes(job.status) ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
          <SectionHeading
            title={
              job.confirmation_gate === "t1"
                ? "Confirm you’re on the way"
                : "Confirm this booking"
            }
          />
          <p className="m-0 text-[14px] leading-5 text-[#5F5F66]">
            {job.confirmation_gate === "t24"
              ? "Please confirm you can still take this clean (24-hour gate)."
              : job.confirmation_gate === "t6"
                ? "Reconfirm before the shorter 6-hour window closes."
                : "Mark yourself on the way so the customer stays protected."}
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button
              className={actionPrimary}
              disabled={working}
              onClick={() => void confirmGate(true)}
              style={pillPrimaryStyle}
              type="button"
            >
              Confirm
            </button>
            <button
              className={actionOutline}
              disabled={working}
              onClick={() => void confirmGate(false)}
              type="button"
            >
              Can’t make it
            </button>
          </div>
        </section>
      ) : null}

      {locationProblem && job.status === "cleaner_en_route" ? (
        <div className="rounded-[18px] bg-[#FFF5E6] px-5 py-4 text-[14px] text-[#8A5200]">
          <p className="m-0 font-semibold">Your location isn&apos;t being shared</p>
          <p className="m-0 mt-1 leading-5">{locationProblem}</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[18px] bg-[#FFF5E6] px-5 py-4 text-[14px] text-[#8A5200]">
          <div className="flex gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            {error}
          </div>
          {overrideCoords || locationFailed ? (
            <Button
              className="mt-3 rounded-full"
              onClick={() => void action("override")}
              size="sm"
              variant="outline"
            >
              {job.status === "in_progress"
                ? "Ask Mundoria to accept that I've finished"
                : "Ask Mundoria to accept my arrival"}
            </Button>
          ) : null}
        </div>
      ) : null}

      <JobBrief hidePay job={job} />

      <section className="flex flex-col gap-3 overflow-hidden rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Map" />
        <RouteMap job={job} />
      </section>

      {safetyAlertAllowed(job.status, job.scheduled_date) ? (
        <div className="flex justify-center pb-1 sm:justify-start">
          <button
            className={actionDanger}
            disabled={working}
            onClick={() => setShowSafety(true)}
            type="button"
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={2} />
            Safety alert
          </button>
        </div>
      ) : null}

      <SafetyAlertSheet
        bookingId={job.id}
        onClose={() => setShowSafety(false)}
        onSubmitted={() => {
          setJob((current) => ({
            ...current,
            safety_hold_at: new Date().toISOString(),
          }));
          setError("Safety alert sent to Mundoria.");
          router.refresh();
        }}
        open={showSafety}
        role="cleaner"
        scheduledDate={job.scheduled_date}
        status={job.status}
        supportHref="/help"
      />
    </div>
  );
}

function RouteMap({ job }: { job: CleanerJob }) {
  if (job.address?.latitude == null || job.address.longitude == null) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[18px] bg-[#F3F4F6] text-[14px] text-[#5F5F66]">
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
      className="h-64 overflow-hidden rounded-[18px]"
      markers={[
        {
          color: "#524096",
          id: "job-address",
          position,
          title: `${job.address.address_line_1}, ${job.address.postcode}`,
        },
      ]}
      zoom={14}
    />
  );
}
