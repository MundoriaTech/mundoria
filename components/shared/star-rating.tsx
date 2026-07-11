"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function StarRating({
  className,
  onChange,
  readonly = false,
  size = "md",
  value,
}: {
  className?: string;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  value: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;
  const iconSize = {
    lg: "h-8 w-8",
    md: "h-6 w-6",
    sm: "h-4 w-4",
  }[size];

  return (
    <div
      aria-label={`${value} out of 5 stars`}
      className={cn("inline-flex items-center", className)}
      onMouseLeave={() => setHovered(null)}
      role={readonly ? "img" : "radiogroup"}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star <= displayValue;
        return (
          <button
            aria-checked={!readonly ? value === star : undefined}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className={cn(
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              readonly && "pointer-events-none",
            )}
            disabled={readonly}
            key={star}
            onClick={() => onChange?.(star)}
            onFocus={() => !readonly && setHovered(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            role={readonly ? undefined : "radio"}
            type="button"
          >
            <Star
              className={cn(
                iconSize,
                selected
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
