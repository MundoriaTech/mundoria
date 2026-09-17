"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

function toIso(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function BookingCalendar({
  className,
  minDate,
  mode = "single",
  onChange,
  selectedDates,
  selectedDate,
}: {
  className?: string;
  /** YYYY-MM-DD inclusive lower bound (defaults to today). */
  minDate?: string;
  mode?: "single" | "multi";
  onChange: (dates: string[]) => void;
  /** Multi-select dates (sorted). Used when mode is multi. */
  selectedDates?: string[];
  /** Single selected date. Used when mode is single. */
  selectedDate?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const earliest = minDate ?? today;
  const seed =
    mode === "multi"
      ? selectedDates?.[0]
      : selectedDate;
  const [viewMonth, setViewMonth] = useState(() =>
    seed ? new Date(`${seed}T12:00:00`) : new Date(),
  );

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const selected = new Set(
    mode === "multi"
      ? selectedDates ?? []
      : selectedDate
        ? [selectedDate]
        : [],
  );

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    const monthStart = toIso(next.getFullYear(), next.getMonth(), 1);
    if (monthStart < earliest.slice(0, 8) + "01") return;
    setViewMonth(next);
  }

  function pickDay(day: number) {
    const iso = toIso(year, month, day);
    if (iso < earliest) return;
    if (mode === "single") {
      onChange([iso]);
      return;
    }
    const next = new Set(selected);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    onChange(Array.from(next).sort());
  }

  return (
    <div
      className={cn(
        "max-w-md rounded-2xl bg-[#f3f3f5] p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#1c133b] touch-manipulation"
          onClick={() => shiftMonth(-1)}
          type="button"
        >
          ‹
        </button>
        <p className="font-semibold text-[#1c133b]">{monthLabel}</p>
        <button
          aria-label="Next month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#1c133b] touch-manipulation"
          onClick={() => shiftMonth(1)}
          type="button"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#8b8798]">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const iso = toIso(year, month, day);
          const disabled = iso < earliest;
          const isSelected = selected.has(iso);
          return (
            <button
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[#1c133b] touch-manipulation",
                isSelected && "bg-[#6a45b8] font-bold text-white",
                disabled && "opacity-30",
                !isSelected && !disabled && "hover:bg-white",
              )}
              disabled={disabled}
              key={iso}
              onClick={() => pickDay(day)}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
