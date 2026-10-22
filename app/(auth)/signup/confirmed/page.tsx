import { Check } from "lucide-react";
import Link from "next/link";

import { safeInternalPath } from "@/components/auth/email-sent-panel";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Email confirmed",
};

export default function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeInternalPath(searchParams.next);
  const continueHref = next ?? "/dashboard";
  const fromBooking = continueHref.startsWith("/booking");
  const continueLabel = fromBooking
    ? "Continue booking"
    : continueHref.startsWith("/cleaner")
      ? "Continue onboarding"
      : "Continue";

  return (
    <main className="flex min-h-screen flex-col bg-[#f9f6ef]">
      <header className="border-b border-[#e8e0d0]/80 bg-[#f9f6ef]/95">
        <div className="mx-auto flex h-14 w-full max-w-[1140px] items-center justify-center px-5 sm:h-16">
          <LandingLogo href="/" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f6ee]">
            <Check aria-hidden className="h-7 w-7 text-[#1f7a45]" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
            Email confirmed
          </h1>
          <p className="mt-3 text-base leading-7 text-[#5a5470]">
            {fromBooking
              ? "You’re all set. Pick up where you left off and finish your booking."
              : "You’re all set. Your Mundoria account is ready to use."}
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              className="h-12 w-full max-w-xs rounded-full bg-[#1c133b] text-base font-semibold text-white hover:bg-[#1c133b]/90"
            >
              <Link href={continueHref}>{continueLabel}</Link>
            </Button>
          </div>
          {!fromBooking ? (
            <p className="mt-6 text-sm text-[#8a8498]">
              <Link className="font-medium text-[#1c133b] hover:underline" href="/">
                Back to home
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
