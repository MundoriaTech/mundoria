"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types/customer";

export type BookingCategoryOption = {
  description: string;
  label: string;
  value: ServiceCategory;
};

/** Main booking categories — not every catalogue niche. */
export const BOOKING_HEADER_CATEGORIES: BookingCategoryOption[] = [
  {
    description: "For your home, one-off or on a schedule.",
    label: "House Cleaning",
    value: "residential",
  },
  {
    description: "Offices, retail, hospitality, education and shared areas.",
    label: "Workspace Cleaning",
    value: "commercial",
  },
  {
    description:
      "Pregnancy & postpartum, hospital discharge, or bereavement support.",
    label: "Recovery cleaning",
    value: "recovery",
  },
];

export function bookingHeaderCategoryLabel(category: ServiceCategory | null) {
  const fromHeader = BOOKING_HEADER_CATEGORIES.find(
    (item) => item.value === category,
  );
  if (fromHeader) return fromHeader.label;
  if (category === "moving_home") return "Moving Home";
  if (category === "short_term_rental") return "Airbnb & Short Lets";
  return "House Cleaning";
}

function bookingHeaderCategoryShortLabel(category: ServiceCategory | null) {
  switch (category) {
    case "commercial":
      return "Workspace";
    case "recovery":
      return "Recovery";
    case "moving_home":
      return "Moving";
    case "short_term_rental":
      return "Short lets";
    case "residential":
    default:
      return "House";
  }
}

export function BookingCategoryMenu({
  disabled = false,
  onSelect,
  selected,
}: {
  disabled?: boolean;
  onSelect: (category: ServiceCategory) => void;
  selected: ServiceCategory | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const triggerLabel = bookingHeaderCategoryLabel(selected);
  const currentInMenu = BOOKING_HEADER_CATEGORIES.find(
    (item) => item.value === selected,
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 px-2 text-sm font-semibold text-[#1c133b] transition hover:opacity-70 touch-manipulation sm:h-10 sm:px-2.5",
          disabled && "cursor-not-allowed opacity-50",
        )}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="sm:hidden">
          {bookingHeaderCategoryShortLabel(selected)}
        </span>
        <span className="hidden sm:inline">{triggerLabel}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 text-[#1c133b] transition",
            open && "rotate-180",
          )}
          strokeWidth={2.25}
        />
      </button>

      {open ? (
        <div
          aria-label="Cleaning type"
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-[60] w-[min(17.5rem,calc(100vw-1.25rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#ebe4da] bg-white py-2 shadow-[0_18px_40px_rgba(28,19,59,0.14)]"
          id={listId}
          role="listbox"
        >
          {BOOKING_HEADER_CATEGORIES.map((item) => {
            const active = item.value === currentInMenu?.value;
            return (
              <button
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition touch-manipulation hover:bg-[#faf8f5]",
                  active && "bg-[#f8f5ff]",
                )}
                key={item.value}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#1c133b]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-[#5a5470]">
                    {item.description}
                  </span>
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-white"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : (
                  <span aria-hidden className="h-5 w-5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
