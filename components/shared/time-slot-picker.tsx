"use client";

import { cn } from "@/lib/utils";

export type TimeSlotAvailability =
  | string[]
  | Record<string, string[]>
  | ((date: string) => string[]);

const defaultSlots = Array.from({ length: 16 }, (_, index) => {
  const hour = index + 7;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function TimeSlotPicker({
  availability,
  className,
  date,
  onChange,
  value,
}: {
  availability?: TimeSlotAvailability;
  className?: string;
  date: Date | string;
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
    <div className={cn("grid grid-cols-3 gap-2 min-[420px]:grid-cols-4", className)}>
      {defaultSlots.map((slot) => {
        const enabled = available.has(slot);
        const selected = value === slot;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "min-h-11 rounded-md border px-2 py-2.5 text-sm transition-colors touch-manipulation",
              selected && "border-primary bg-primary text-primary-foreground",
              !enabled && "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
            )}
            disabled={!enabled}
            key={slot}
            onClick={() => onChange(slot)}
            type="button"
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
