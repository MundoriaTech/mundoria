"use client";

import { CheckCircle2, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INCIDENT_CATEGORIES } from "@/lib/cleaner/onboarding-compliance";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "border-2 border-[#1c133b] bg-[#f9f6ef] focus-visible:ring-[#1c133b]";

const SEVERITIES = [
  { description: "No immediate risk", label: "Standard", value: "standard" },
  { description: "Needs attention soon", label: "Urgent", value: "urgent" },
  { description: "Serious or ongoing risk", label: "Emergency", value: "emergency" },
] as const;

type Severity = (typeof SEVERITIES)[number]["value"];

export interface IncidentBookingOption {
  id: string;
  label: string;
}

export function IncidentReportForm({
  bookings = [],
}: {
  bookings?: IncidentBookingOption[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(INCIDENT_CATEGORIES[0].value);
  const [severity, setSeverity] = useState<Severity>("standard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [emergencyContacted, setEmergencyContacted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setCategory(INCIDENT_CATEGORIES[0].value);
    setSeverity("standard");
    setTitle("");
    setDescription("");
    setOccurredAt("");
    setLocationNote("");
    setBookingId("");
    setEmergencyContacted(false);
    setError(null);
    setSubmitted(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/cleaner/incidents", {
        body: JSON.stringify({
          booking_id: bookingId || null,
          category,
          description,
          emergency_services_contacted: emergencyContacted,
          location_note: locationNote || null,
          occurred_at: occurredAt ? new Date(occurredAt).toISOString() : null,
          severity,
          title,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not send your report. Please try again.");
        return;
      }
      setSubmitted(true);
      router.refresh();
    } catch {
      setError("Could not send your report. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#6a45b8]" />
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[#1c133b]">
          Report sent
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5a5470]">
          Thank you. Our team has been notified and will review your report.
          We’ll contact you if we need anything else. If anyone is in danger,
          call 999 now.
        </p>
        <Button
          className="mt-6 h-11 rounded-full bg-[#1c133b] px-6 font-semibold text-white hover:bg-[#312c79]"
          onClick={reset}
          type="button"
        >
          Report another incident
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-5 sm:p-7"
      onSubmit={submit}
    >
      <div className="flex items-start gap-3 rounded-xl border-2 border-[#1c133b] bg-white p-4">
        <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-[#d4694a]" />
        <div className="text-sm leading-6 text-[#1c133b]">
          <p className="font-semibold">In danger or someone is hurt? Call 999.</p>
          <p className="text-[#5a5470]">
            For a crime or incident that is not an emergency, call 101. Report
            it here once you are safe.
          </p>
        </div>
      </div>

      <Field label="What type of incident?" htmlFor="incident-category">
        <select
          className={cn(
            "h-11 w-full rounded-md px-3 text-sm text-[#1c133b] outline-none focus-visible:ring-2 [color-scheme:light]",
            FIELD_CLASS,
          )}
          id="incident-category"
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          {INCIDENT_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold text-[#1c133b]">
          How serious is it?
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SEVERITIES.map((item) => {
            const active = severity === item.value;
            return (
              <label
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-[#1c133b] px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-[#1c133b] text-white"
                    : "bg-[#f9f6ef] text-[#1c133b] hover:bg-white",
                )}
                key={item.value}
              >
                <input
                  checked={active}
                  className="sr-only"
                  name="severity"
                  onChange={() => setSeverity(item.value)}
                  type="radio"
                  value={item.value}
                />
                <span className="block font-semibold">{item.label}</span>
                <span
                  className={cn(
                    "block text-xs",
                    active ? "text-white/75" : "text-[#5a5470]",
                  )}
                >
                  {item.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {category === "injury" || severity !== "standard" ? (
        <p
          className="rounded-xl border-2 border-[#1c133b] bg-white px-4 py-3 text-sm leading-6 text-[#5a5470]"
          role="note"
        >
          <span className="font-semibold text-[#1c133b]">
            May need RIDDOR reporting.
          </span>{" "}
          Some work-related injuries must be reported to the HSE. Our team will
          review your report and let you know if anything further is needed. You
          don’t need to do anything extra.
        </p>
      ) : null}

      <Field label="Short title" htmlFor="incident-title">
        <Input
          className={FIELD_CLASS}
          id="incident-title"
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Slipped on wet kitchen floor"
          required
          value={title}
        />
      </Field>

      <Field label="What happened?" htmlFor="incident-description">
        <textarea
          className={cn(
            "min-h-32 w-full rounded-md px-3 py-2 text-sm text-[#1c133b] outline-none placeholder:text-[#8b8798] focus-visible:ring-2 [color-scheme:light]",
            FIELD_CLASS,
          )}
          id="incident-description"
          maxLength={4000}
          minLength={10}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what happened, who was involved and what you did."
          required
          value={description}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="When did it happen? (optional)" htmlFor="incident-when">
          <Input
            className={FIELD_CLASS}
            id="incident-when"
            max={toLocalInputValue(new Date())}
            onChange={(event) => setOccurredAt(event.target.value)}
            type="datetime-local"
            value={occurredAt}
          />
        </Field>
        <Field label="Where? (optional)" htmlFor="incident-location">
          <Input
            className={FIELD_CLASS}
            id="incident-location"
            maxLength={500}
            onChange={(event) => setLocationNote(event.target.value)}
            placeholder="e.g. Upstairs bathroom"
            value={locationNote}
          />
        </Field>
      </div>

      {bookings.length ? (
        <Field label="Related booking (optional)" htmlFor="incident-booking">
          <select
            className={cn(
              "h-11 w-full rounded-md px-3 text-sm text-[#1c133b] outline-none focus-visible:ring-2 [color-scheme:light]",
              FIELD_CLASS,
            )}
            id="incident-booking"
            onChange={(event) => setBookingId(event.target.value)}
            value={bookingId}
          >
            <option value="">Not linked to a booking</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
        <input
          checked={emergencyContacted}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-[#1c133b] accent-[#1c133b]"
          onChange={(event) => setEmergencyContacted(event.target.checked)}
          type="checkbox"
        />
        <span>I have contacted the emergency services (999 or 101).</span>
      </label>

      {error ? (
        <p
          className="rounded-xl border-2 border-[#d4694a] bg-white px-4 py-3 text-sm text-[#9b3a1f]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        className="h-12 w-full rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white hover:bg-[#312c79] sm:w-auto"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Sending…" : "Send report"}
      </Button>
    </form>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#1c133b]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
