"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { SupportMessengerLauncher } from "@/components/support/support-messenger-launcher";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** Matches booking sticky Next / Book bar (`lg:hidden`). */
const BOOKING_STICKY_BAR_MQ = "(max-width: 1023px)";

/** Booking chrome. Mobile: category under brand. Desktop: category beside Sign in. */
export function BookingChrome({
  backDisabled = false,
  categoryControl = null,
  children,
  className,
  onBack,
  onHome,
  progress = null,
  progressLabel = null,
  signedIn,
}: {
  backDisabled?: boolean;
  /**
   * Render the category menu. Called separately for mobile / desktop slots so
   * each placement gets its own instance (avoids one node in two DOM spots).
   */
  categoryControl?: (() => ReactNode) | null;
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
    ? "/booking/new?step=auth&auth=signin"
    : "/setup";
  const progressPct =
    progress == null
      ? null
      : Math.min(100, Math.max(0, Math.round(progress * 100)));
  const hasCategory = Boolean(categoryControl);

  // Lift the support messenger above the sticky Next / Book bar on mobile.
  useEffect(() => {
    const mq = window.matchMedia(BOOKING_STICKY_BAR_MQ);
    const sync = () => {
      if (mq.matches) {
        document.documentElement.setAttribute("data-sticky-book", "");
      } else {
        document.documentElement.removeAttribute("data-sticky-book");
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.documentElement.removeAttribute("data-sticky-book");
    };
  }, []);

  return (
    <div
      className={cn("flex min-h-dvh flex-col bg-[#f9f6ef]", className)}
    >
      <header className="sticky top-0 z-50 border-b border-[#e8e0d0]/80 bg-[#f9f6ef]/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-5">
          {/* Mobile header */}
          <div className="sm:hidden">
            <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-self-start gap-0.5 py-2 text-sm font-medium text-[#1c133b] transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
                disabled={backDisabled}
                onClick={onBack}
                type="button"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                <span className="hidden min-[380px]:inline">Back</span>
              </button>
              <div className="flex min-w-0 justify-center justify-self-center">
                {onHome ? (
                  <button
                    aria-label="Mundoria home"
                    className="inline-flex min-h-11 shrink-0 items-center touch-manipulation"
                    onClick={onHome}
                    type="button"
                  >
                    <LandingLogo className="text-[1.15rem]" />
                  </button>
                ) : (
                  <LandingLogo className="text-[1.15rem]" href="/" />
                )}
              </div>
              {signedIn ? (
                <span className="w-11 justify-self-end" />
              ) : (
                <Link
                  className="inline-flex h-9 items-center justify-center justify-self-end rounded-full border border-[#1c133b] px-3 text-xs font-semibold text-[#1c133b] transition hover:bg-white/70 touch-manipulation"
                  href={authHref}
                >
                  Sign in
                </Link>
              )}
            </div>
            {hasCategory ? (
              <div className="flex justify-center pb-2.5 pt-0.5">
                {categoryControl?.()}
              </div>
            ) : null}
          </div>

          {/* Desktop / tablet header */}
          <div className="relative hidden h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:grid">
            <button
              className="inline-flex min-h-11 items-center justify-self-start gap-0.5 py-2 text-sm font-medium text-[#1c133b] transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
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
                className="inline-flex min-h-11 shrink-0 items-center justify-self-center touch-manipulation"
                onClick={onHome}
                type="button"
              >
                <LandingLogo className="text-[1.4rem]" />
              </button>
            ) : (
              <LandingLogo
                className="justify-self-center text-[1.4rem]"
                href="/"
              />
            )}
            <div className="flex items-center justify-self-end gap-2.5">
              {hasCategory ? categoryControl?.() : null}
              {signedIn ? null : (
                <Link
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#1c133b] px-4 text-sm font-semibold text-[#1c133b] transition hover:bg-white/70 touch-manipulation"
                  href={authHref}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>

        {progressPct != null ? (
          <div>
            {progressLabel ? (
              <p className="mx-auto w-full max-w-[1140px] px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8498] sm:px-5">
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
      <SupportMessengerLauncher />
    </div>
  );
}

/** Booking wash, a touch lighter than the landing cream panel. */
export const BOOKING_BUTTER = "#f9f6ef";
export const BOOKING_PURPLE = "#6a45b8";
export const BOOKING_PURPLE_HOVER = "#5a38a3";
