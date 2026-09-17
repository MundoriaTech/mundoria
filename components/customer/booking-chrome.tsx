"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** WeCasa-style booking chrome — Back · Logo · Sign in */
export function BookingChrome({
  children,
  className,
  onBack,
  signedIn,
}: {
  children: ReactNode;
  className?: string;
  onBack: () => void;
  signedIn: boolean;
}) {
  const configured = hasSupabasePublicConfig();
  const authHref = configured
    ? signedIn
      ? "/bookings"
      : "/login?next=/booking/new"
    : "/setup";

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", className)}>
      <header className="sticky top-0 z-50 border-b border-[#eeeef1] bg-white">
        <div className="relative mx-auto flex h-14 w-full max-w-[1140px] items-center justify-between gap-3 px-5 sm:h-16 md:px-5">
          <button
            className="inline-flex items-center gap-0.5 text-sm font-medium text-[#1c133b] transition hover:opacity-70 touch-manipulation"
            onClick={onBack}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            Back
          </button>
          <LandingLogo
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.25rem] sm:text-[1.4rem]"
            href="/"
          />
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#1c133b] px-4 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f5fb] touch-manipulation"
            href={authHref}
          >
            {signedIn ? "Account" : "Sign in"}
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

export const BOOKING_PURPLE = "#6a45b8";
export const BOOKING_PURPLE_HOVER = "#5a38a3";
