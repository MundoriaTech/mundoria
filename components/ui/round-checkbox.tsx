"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Round checkbox with a white tick on Mundoria purple when checked. */
export const RoundCheckbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
  <span className={cn("relative inline-flex h-5 w-5 shrink-0", className)}>
    <input
      className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-[#D4CCEA] bg-white transition checked:border-[#524096] checked:bg-[#524096] hover:border-[#524096]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#524096]/30 disabled:cursor-not-allowed disabled:opacity-50"
      ref={ref}
      type="checkbox"
      {...props}
    />
    <Check
      aria-hidden
      className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
      strokeWidth={3.5}
    />
  </span>
));
RoundCheckbox.displayName = "RoundCheckbox";
