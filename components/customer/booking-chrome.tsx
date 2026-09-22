"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** WeCasa-style booking chrome — Back · Logo · Sign in */
export function BookingChrome({
  backDisabled = false,
  children,
  className,
  onBack,
  signedIn,
}: {
  backDisabled?: boolean;
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
          <LandingLogo
            className="justify-self-center text-[1.25rem] sm:text-[1.4rem]"
            href="/"
          />
          <Link
            className="inline-flex h-9 items-center justify-center justify-self-end rounded-full border border-[#1c133b] px-4 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f5fb] touch-manipulation"
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
