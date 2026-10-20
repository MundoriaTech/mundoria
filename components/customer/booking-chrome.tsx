"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** Booking chrome — Back · Logo · Sign in for guests */
export function BookingChrome({
  backDisabled = false,
  children,
  className,
  onBack,
  onHome,
  progress = null,
  progressLabel = null,
  signedIn,
}: {
  backDisabled?: boolean;
  children: ReactNode;
  className?: string;
  onBack: () => void;
  /** When set, logo abandons the booking flow instead of a plain home link. */
  onHome?: () => void;
  /** 0–1 progress through the booking funnel; omit to hide the bar. */
  progress?: number | null;
  /** e.g. "Step 2 of 8" shown above the bar. */
  progressLabel?: string | null;
  signedIn: boolean;
}) {
  const configured = hasSupabasePublicConfig();
  const authHref = configured
    ? `/login?redirectTo=${encodeURIComponent("/booking/new")}`
    : "/setup";
  const progressPct =
    progress == null
      ? null
      : Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div
      className={cn("flex min-h-screen flex-col bg-[#f9f6ef]", className)}
    >
      <header className="sticky top-0 z-50 border-b border-[#e8e0d0]/80 bg-[#f9f6ef]/95 backdrop-blur-sm">
        <div className="relative mx-auto grid h-14 w-full max-w-[1140px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 sm:h-16 md:px-5">
          <button
            className="inline-flex items-center justify-self-start gap-0.5 text-sm font-medium text-[#1c133b] transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
            disabled={backDisabled}
            onClick={onBack}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            Back
          </button>
          {onHome ? (
            <button
              aria-label="Mundoria home"
              className="inline-flex shrink-0 items-center justify-self-center touch-manipulation"
              onClick={onHome}
              type="button"
            >
              <LandingLogo className="text-[1.25rem] sm:text-[1.4rem]" />
            </button>
          ) : (
            <LandingLogo
              className="justify-self-center text-[1.25rem] sm:text-[1.4rem]"
              href="/"
            />
          )}
          {signedIn ? (
            <span />
          ) : (
            <Link
              className="inline-flex h-9 items-center justify-center justify-self-end rounded-full border border-[#1c133b] px-4 text-sm font-semibold text-[#1c133b] transition hover:bg-white/70 touch-manipulation"
              href={authHref}
            >
              Sign in
            </Link>
          )}
        </div>
        {progressPct != null ? (
          <div>
            {progressLabel ? (
              <p className="mx-auto w-full max-w-[1140px] px-5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8498] md:px-5">
                {progressLabel}
              </p>
            ) : null}
            <div
              aria-label={
                progressLabel
                  ? progressLabel
                  : `Booking progress: ${progressPct}%`
              }
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPct}
              className="h-1.5 w-full bg-[#e8e0d0]"
              role="progressbar"
            >
              <div
                className="h-full bg-[#6a45b8] transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Booking wash — a touch lighter than the landing cream panel. */
export const BOOKING_BUTTER = "#f9f6ef";
export const BOOKING_PURPLE = "#6a45b8";
export const BOOKING_PURPLE_HOVER = "#5a38a3";
