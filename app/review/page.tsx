import type { Metadata } from "next";

import { GuestFeedbackForm } from "@/components/marketing/guest-feedback-form";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "How was your clean?",
};

export default function PublicReviewPage() {
  return (
    <main className="min-h-dvh bg-[#f3eef8]">
      <header className="sticky top-0 z-10 border-b border-[#e4dcf2] bg-[#f3eef8]/95 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:px-8">
        <a className="inline-flex shrink-0 items-center" href="/review">
          <LandingLogo className="h-6 w-auto sm:h-8" priority />
        </a>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:min-h-[calc(100dvh-5rem)] sm:justify-center sm:px-8 sm:py-16">
        <GuestFeedbackForm />
      </div>
    </main>
  );
}
