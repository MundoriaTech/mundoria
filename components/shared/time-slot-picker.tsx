"use client";

import { cn } from "@/lib/utils";

export type TimeSlotAvailability =
  | string[]
  | Record<string, string[]>
  | ((date: string) => string[]);

/** Half-hour slots from 07:00 through 21:30 (matches booking mock). */
const defaultSlots = Array.from({ length: 30 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export function TimeSlotPicker({
  availability,
  className,
  date,
  formatSlotPrice,
  onChange,
  value,
}: {
  availability?: TimeSlotAvailability;
  className?: string;
  date: Date | string;
  /** Optional price label per slot (e.g. "£62"). */
  formatSlotPrice?: (slot: string) => string | null;
  onChange: (slot: string) => void;
  value?: string;
}) {
  const dateKey =
    typeof date === "string" ? date : date.toISOString().slice(0, 10);
  const availableSlots =
    typeof availability === "function"
      ? availability(dateKey)
      : Array.isArray(availability)
        ? availability
        : availability?.[dateKey] ?? defaultSlots;
  const available = new Set(availableSlots);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 min-[420px]:grid-cols-4",
        className,
      )}
    >
      {defaultSlots.map((slot) => {
        const enabled = available.has(slot);
        const selected = value === slot;
        const priceLabel = formatSlotPrice?.(slot) ?? null;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center rounded-md border px-1.5 py-2 text-sm transition-colors touch-manipulation sm:px-2",
              selected && "border-primary bg-primary text-primary-foreground",
              !enabled && "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
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
                  selected ? "text-primary-foreground/80" : "text-muted-foreground",
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
