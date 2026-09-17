"use client";

import { cn } from "@/lib/utils";

export type TimeSlotAvailability =
  | string[]
  | Record<string, string[]>
  | ((date: string) => string[]);

/** Daytime bookable window: 07:00–23:00 (16 hours). */
export const DAY_WINDOW_START_MINUTES = 7 * 60;
export const DAY_WINDOW_END_MINUTES = 23 * 60;

function formatMinutes(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function slotToMinutes(slot: string) {
  const [hour, minute] = slot.split(":").map(Number);
  return hour * 60 + minute;
}

/** Half-hour start times across the full daytime window. */
export const dayWindowSlots = Array.from(
  {
    length:
      Math.floor((DAY_WINDOW_END_MINUTES - DAY_WINDOW_START_MINUTES) / 30) + 1,
  },
  (_, index) => formatMinutes(DAY_WINDOW_START_MINUTES + index * 30),
);

/**
 * Start times in the daytime window where start + duration finishes by 23:00.
 */
export function slotsFinishingByWindowEnd(durationHours: number) {
  const durationMinutes = Math.max(0, Math.round(durationHours * 60));
  const lastStart = DAY_WINDOW_END_MINUTES - durationMinutes;
  if (lastStart < DAY_WINDOW_START_MINUTES) return [];
  return dayWindowSlots.filter(
    (slot) => slotToMinutes(slot) <= lastStart,
  );
}

export function TimeSlotPicker({
  availability,
  className,
  date,
  formatSlotPrice,
  onChange,
  value,
  values,
}: {
  availability?: TimeSlotAvailability;
  className?: string;
  date: Date | string;
  /** Optional price label per slot (e.g. "£62"). */
  formatSlotPrice?: (slot: string) => string | null;
  onChange: (slot: string) => void;
  value?: string;
  /** When set, highlight multiple selected slots (flexible availability). */
  values?: string[];
}) {
  const dateKey =
    typeof date === "string" ? date : date.toISOString().slice(0, 10);
  const availableSlots =
    typeof availability === "function"
      ? availability(dateKey)
      : Array.isArray(availability)
        ? availability
        : availability?.[dateKey] ?? dayWindowSlots;
  const available = new Set(availableSlots);
  const selectedSet = new Set(
    values?.length ? values : value ? [value] : [],
  );

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6",
        className,
      )}
    >
      {dayWindowSlots.map((slot) => {
        const enabled = available.has(slot);
        const selected = selectedSet.has(slot);
        const priceLabel = formatSlotPrice?.(slot) ?? null;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center rounded-xl bg-[#f3f3f5] px-1.5 py-2 text-sm text-[#1c133b] transition-colors touch-manipulation sm:px-2",
              selected &&
                "border-2 border-transparent bg-[#6a45b8] font-semibold text-white",
              !selected && enabled && "hover:bg-[#ececef]",
              !enabled &&
                "cursor-not-allowed bg-[#f3f3f5] text-[#8b8798] opacity-40",
            )}
            disabled={!enabled}
            key={slot}
            onClick={() => onChange(slot)}
            type="button"
          >
            <span className="font-medium">{slot}</span>
            {priceLabel ? (
              <span
                className={cn(
                  "mt-0.5 text-[11px] leading-none",
                  selected ? "text-white/85" : "text-[#8b8798]",
                )}
              >
                {priceLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
