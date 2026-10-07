import type { Metadata } from "next";

import { GuestFeedbackForm } from "@/components/marketing/guest-feedback-form";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "How was your clean?",
};

export default function PublicReviewPage() {
  return (
    <main className="min-h-dvh bg-[#f3eef8] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 sm:py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col sm:min-h-[calc(100dvh-8rem)] sm:justify-center">
        <LandingLogo className="h-10 w-auto sm:h-10" priority />
        <h1 className="mt-6 text-[2rem] font-black leading-[1.15] tracking-[-0.05em] text-[#1c133b] sm:mt-8 sm:text-5xl">
          How was your clean?
        </h1>
        <p className="mt-3 max-w-md text-base leading-7 text-[#5a5470]">
          Tell us in your own words.
        </p>
        <div className="mt-8">
          <GuestFeedbackForm />
        </div>
      </div>
    </main>
  );
}
