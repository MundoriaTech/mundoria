"use client";

import { CheckCircle2, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  pillPrimary,
  pillPrimaryStyle,
  SectionHeading,
} from "@/components/customer/dashboard/section-banner";
import { DateTimePickerField } from "@/components/shared/date-picker-field";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { SimpleSelect } from "@/components/ui/select";
import { INCIDENT_CATEGORIES } from "@/lib/cleaner/onboarding-compliance";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-[12px] border-0 bg-[#F3F4F6] px-3.5 text-[14px] text-[#1E1848] outline-none ring-0 placeholder:text-[#8B8798] focus:bg-white focus:ring-2 focus:ring-[#D4CCEA]";

const SEVERITIES = [
  { description: "No immediate risk", label: "Standard", value: "standard" },
  { description: "Needs attention soon", label: "Urgent", value: "urgent" },
  {
    description: "Serious or ongoing risk",
    label: "Emergency",
    value: "emergency",
  },
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
      <div className="rounded-[22px] bg-white p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAE7F5]">
          <CheckCircle2 className="h-6 w-6 text-[#524096]" strokeWidth={1.8} />
        </div>
        <h2 className="m-0 mt-4 text-[20px] font-semibold tracking-[-0.02em] text-[#1E1848]">
          Report sent
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-5 text-[#5F5F66]">
          Thank you. Our team has been notified and will review your report.
          We’ll contact you if we need anything else. If anyone is in danger,
          call 999 now.
        </p>
        <button
          className={cn(pillPrimary, "mt-6")}
          onClick={reset}
          style={pillPrimaryStyle}
          type="button"
        >
          Report another incident
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5"
      onSubmit={submit}
    >
      <SectionHeading title="Report an incident" />

      <div className="flex items-start gap-3 rounded-[18px] bg-[#fff7f2] px-4 py-3.5">
        <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-[#9A2B18]" />
        <div className="text-[14px] leading-5 text-[#7a3b28]">
          <p className="m-0 font-semibold">In danger or someone is hurt? Call 999.</p>
          <p className="m-0 mt-1 text-[#7a3b28]/85">
            For a crime or incident that is not an emergency, call 101. Report
            it here once you are safe.
          </p>
        </div>
      </div>

      <Field label="What type of incident?" htmlFor="incident-category">
        <SimpleSelect
          className={cn(fieldClass, "text-[#1E1848]")}
          id="incident-category"
          onChange={setCategory}
          options={INCIDENT_CATEGORIES.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          value={category}
        />
      </Field>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 px-0 text-[13px] font-semibold text-[#1E1848]">
          How serious is it?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SEVERITIES.map((item) => {
            const active = severity === item.value;
            return (
              <label
                className={cn(
                  "cursor-pointer rounded-[14px] px-3.5 py-3 text-[13px] transition",
                  active
                    ? "bg-[#524096] text-white"
                    : "bg-[#F3F4F6] text-[#1E1848] hover:bg-[#ECE8F6]",
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
                    "mt-0.5 block text-[12px] leading-4",
                    active ? "text-white/75" : "text-[#6B6B70]",
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
          className="m-0 rounded-[14px] bg-[#EAE7F5] px-4 py-3 text-[13px] leading-5 text-[#524096]"
          role="note"
        >
          <span className="font-semibold">May need RIDDOR reporting.</span> Some
          work-related injuries must be reported to the HSE. Our team will review
          your report and let you know if anything further is needed.
        </p>
      ) : null}

      <Field label="Short title" htmlFor="incident-title">
        <Input
          className={fieldClass}
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
            fieldClass,
            "min-h-32 resize-y py-3 leading-5 [color-scheme:light]",
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="When did it happen? (optional)" htmlFor="incident-when">
          <DateTimePickerField
            className="mt-1.5"
            id="incident-when"
            max={toLocalInputValue(new Date())}
            onChange={setOccurredAt}
            triggerClassName={fieldClass.replace("mt-1.5 ", "")}
            value={occurredAt}
          />
        </Field>
        <Field label="Where? (optional)" htmlFor="incident-location">
          <Input
            className={fieldClass}
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
          <SimpleSelect
            className={cn(fieldClass, "text-[#1E1848]")}
            emptyLabel="Not linked to a booking"
            id="incident-booking"
            onChange={setBookingId}
            options={bookings.map((booking) => ({
              label: booking.label,
              value: booking.id,
            }))}
            value={bookingId}
          />
        </Field>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 text-[14px] text-[#1E1848]">
        <RoundCheckbox
          checked={emergencyContacted}
          className="mt-0.5"
          onChange={(event) => setEmergencyContacted(event.target.checked)}
        />
        <span>I have contacted the emergency services (999 or 101).</span>
      </label>

      {error ? (
        <p
          className="m-0 rounded-[14px] bg-[#FEE9E9] px-4 py-3 text-[14px] text-[#C0272D]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className={cn(pillPrimary, "w-full sm:w-auto")}
        disabled={submitting}
        style={pillPrimaryStyle}
        type="submit"
      >
        {submitting ? "Sending…" : "Send report"}
      </button>
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
    <div>
      <label className="text-[13px] font-semibold text-[#1E1848]" htmlFor={htmlFor}>
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
