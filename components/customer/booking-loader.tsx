"use client";

import { cn } from "@/lib/utils";

/** WeCasa-style dual-ring spinner — Mundoria purple + orange. */
export function BookingSpinner({
  className,
  size = "md",
  tone = "brand",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "inverse";
}) {
  const box =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const track =
    size === "sm" ? "border-2" : size === "lg" ? "border-[3.5px]" : "border-[3px]";
  const trackColor = tone === "inverse" ? "border-white/25" : "border-[#efe6ff]";
  const spinColor =
    tone === "inverse"
      ? "border-t-white border-r-white/70"
      : "border-t-[#6a45b8] border-r-[#d4694a]";
  const innerColor =
    tone === "inverse" ? "border-b-white/80" : "border-b-[#6a45b8]/70";

  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0", box, className)}
    >
      <span
        className={cn("absolute inset-0 rounded-full", track, trackColor)}
      />
      <span
        className={cn(
          "absolute inset-0 animate-spin rounded-full border-transparent",
          track,
          spinColor,
        )}
      />
      <span
        className={cn(
          "absolute inset-[22%] animate-[spin_1.35s_linear_infinite_reverse] rounded-full border-transparent",
          size === "sm" ? "border" : "border-2",
          innerColor,
        )}
      />
    </span>
  );
}

/** Full-screen booking loader overlay (WeCasa-style). */
export function BookingLoadingOverlay({
  detail,
  label,
}: {
  detail?: string;
  label: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 px-6 backdrop-blur-[2px]"
      role="status"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <BookingSpinner size="lg" />
        <p className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#1c133b]">
          {label}
        </p>
        {detail ? (
          <p className="mt-2 text-sm leading-6 text-[#5a5470]">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
