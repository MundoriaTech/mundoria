"use client";

import { Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/** Mundoria is light-only — toggle kept as a non-interactive brand control if needed. */
export function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      aria-checked={false}
      aria-label="Light mode"
      className={cn(
        "relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border border-border bg-[#ece3f9] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312c79]",
        className,
      )}
      disabled
      role="switch"
      type="button"
    >
      <Sun
        aria-hidden
        className="pointer-events-none absolute left-1.5 h-3.5 w-3.5 text-[#c79c66] opacity-100"
      />
      <span
        aria-hidden
        className="absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <Sun className="h-3.5 w-3.5 text-[#c79c66]" />
      </span>
    </button>
  );
}
