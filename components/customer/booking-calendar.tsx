"use client";

import { useEffect, useState } from "react";

import { isoDateOrEmpty } from "@/lib/customer/booking-flow";
import { cn } from "@/lib/utils";

function toIso(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthDateFromIso(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  return new Date(year, month - 1, 1, 12);
}

/** Open on the selected day when bookable; otherwise the earliest bookable month. */
function initialViewMonth(earliest: string, seed: string) {
  if (seed && seed >= earliest) return monthDateFromIso(seed);
  return monthDateFromIso(earliest);
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
  const seed = isoDateOrEmpty(
    mode === "multi" ? selectedDates?.[0] : selectedDate,
  );
  const [viewMonth, setViewMonth] = useState(() =>
    initialViewMonth(earliest, seed),
  );

  // If the 48h lead pushes the floor into the next month, jump the view there
  // instead of showing a fully disabled current month.
  useEffect(() => {
    const viewStart = toIso(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const earliestMonthStart = `${earliest.slice(0, 7)}-01`;
    if (viewStart < earliestMonthStart) {
      setViewMonth(monthDateFromIso(earliest));
    }
  }, [earliest, viewMonth]);

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

  const earliestMonthStart = `${earliest.slice(0, 7)}-01`;
  const viewMonthStart = toIso(year, month, 1);
  const canGoPrev = viewMonthStart > earliestMonthStart;

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    const monthStart = toIso(next.getFullYear(), next.getMonth(), 1);
    if (monthStart < earliestMonthStart) return;
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
        "max-w-md rounded-2xl border border-transparent bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#1c133b] touch-manipulation",
            !canGoPrev && "opacity-30",
          )}
          disabled={!canGoPrev}
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
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[#1c133b] touch-manipulation",
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
