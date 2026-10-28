"use client";

import { cn } from "@/lib/utils";

export type TimeSlotAvailability =
  | string[]
  | Record<string, string[]>
  | ((date: string) => string[]);

/** Daytime bookable window: 07:00–23:00 (16 hours). */
export const DAY_WINDOW_START_MINUTES = 7 * 60;
export const DAY_WINDOW_END_MINUTES = 23 * 60;

/** Bookings need this much notice before the slot start. */
export const BOOKING_MIN_LEAD_HOURS = 48;

/** First calendar day that can contain a slot past the lead window. */
export function earliestBookableDateKey(
  minLeadHours: number = BOOKING_MIN_LEAD_HOURS,
  now: Date = new Date(),
) {
  const earliest = new Date(
    now.getTime() + Math.max(0, minLeadHours) * 60 * 60 * 1000,
  );
  return localDateKey(earliest);
}

function formatMinutes(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function slotToMinutes(slot: string) {
  const [hour, minute] = slot.split(":").map(Number);
  return hour * 60 + minute;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function slotStartLocal(dateKey: string, slot: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = slot.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
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
 * Slots sooner than `minLeadHours` from now are excluded on every date.
 */
export function slotsFinishingByWindowEnd(
  durationHours: number,
  options?: {
    date?: string;
    minLeadHours?: number;
    now?: Date;
  },
) {
  const durationMinutes = Math.max(0, Math.round(durationHours * 60));
  const lastStart = DAY_WINDOW_END_MINUTES - durationMinutes;
  if (lastStart < DAY_WINDOW_START_MINUTES) return [];

  const now = options?.now ?? new Date();
  const dateKey = options?.date?.trim().slice(0, 10) || null;
  const minLeadHours = Math.max(0, options?.minLeadHours ?? 0);
  const earliestMs =
    dateKey && minLeadHours > 0
      ? now.getTime() + minLeadHours * 60 * 60 * 1000
      : null;

  return dayWindowSlots.filter((slot) => {
    if (slotToMinutes(slot) > lastStart) return false;
    if (earliestMs == null || !dateKey) return true;
    return slotStartLocal(dateKey, slot).getTime() >= earliestMs;
  });
}

export function TimeSlotPicker({
  availability,
  className,
  date,
  formatSlotPrice,
  onChange,
  primaryValue,
  value,
  values,
}: {
  availability?: TimeSlotAvailability;
  className?: string;
  date: Date | string;
  /** Optional price label per slot (e.g. "£62"). */
  formatSlotPrice?: (slot: string) => string | null;
  onChange: (slot: string) => void;
  /**
   * Preferred / main time when using multi-select `values`.
   * Coloured differently from alternate (extra) slots.
   */
  primaryValue?: string | null;
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
  const preferred =
    primaryValue && selectedSet.has(primaryValue)
      ? primaryValue
      : values?.length
        ? values[0]
        : value ?? null;

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
        const isPreferred = selected && preferred === slot;
        const isAlternate = selected && !isPreferred;
        const priceLabel = formatSlotPrice?.(slot) ?? null;
        return (
          <button
            aria-label={
              isPreferred
                ? `${slot}, preferred time`
                : isAlternate
                  ? `${slot}, extra time`
                  : slot
            }
            aria-pressed={selected}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center rounded-xl bg-[#f3f3f5] px-1.5 py-2 text-sm text-[#1c133b] transition-colors touch-manipulation sm:px-2",
              isPreferred &&
                "border-2 border-transparent bg-[#c79c66] font-semibold text-white",
              isAlternate &&
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
