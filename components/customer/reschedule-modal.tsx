"use client";

import { useMemo, useState } from "react";

import { BookingCalendar } from "@/components/customer/booking-calendar";
import { ActionError } from "@/components/shared/action-error";
import {
  BOOKING_MIN_LEAD_HOURS,
  earliestBookableDateKey,
  TimeSlotPicker,
  slotsFinishingByWindowEnd,
} from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";

export function RescheduleModal({
  bookingId,
  durationHours,
  initialDate,
  initialTime,
  onClose,
  onSaved,
  sameDayAllowed = false,
}: {
  bookingId: string;
  durationHours: number;
  initialDate: string;
  initialTime: string;
  onClose: () => void;
  onSaved: (payload: { date: string; time: string }) => void;
  /** Temporary test exception: allow any future time, same day included. */
  sameDayAllowed?: boolean;
}) {
  // A new time needs the same 48 hours' notice as a new booking
  // (except the temporary same-day test booking).
  const leadHours = sameDayAllowed ? 0 : BOOKING_MIN_LEAD_HOURS;
  const minDate = useMemo(() => earliestBookableDateKey(leadHours), [leadHours]);
  const [date, setDate] = useState(initialDate >= minDate ? initialDate : "");
  const [time, setTime] = useState(initialDate >= minDate ? initialTime.slice(0, 5) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slots = useMemo(
    () =>
      slotsFinishingByWindowEnd(durationHours || 2, {
        date,
        // A tiny lead still hides times that have already passed today.
        minLeadHours: leadHours || 0.01,
      }),
    [date, durationHours, leadHours],
  );

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        body: JSON.stringify({
          scheduledDate: date,
          scheduledStartTime: time,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not reschedule.");
      }
      onSaved({ date, time });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Change date &amp; time</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Free of charge. The new time must be at least{" "}
            {BOOKING_MIN_LEAD_HOURS} hours from now.
          </p>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <BookingCalendar
            minDate={minDate}
            onChange={(dates) => {
              if (dates[0]) setDate(dates[0]);
            }}
            selectedDate={date}
          />
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Available times</p>
            <TimeSlotPicker
              availability={slots}
              date={date}
              onChange={setTime}
              value={time}
            />
          </div>
          {error ? (
            <div className="mt-3">
              <ActionError message={error} title="Couldn’t reschedule this visit" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <Button disabled={saving} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={saving || !date || !time}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save new time"}
          </Button>
        </div>
      </div>
    </div>
  );
}
