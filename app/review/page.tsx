import type { Metadata } from "next";

import { GuestFeedbackForm } from "@/components/marketing/guest-feedback-form";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "How was your clean?",
};

export default function PublicReviewPage() {
  return (
    <main className="min-h-screen bg-[#f7f2ea] px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#823fb2]">
          Mundoria
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#1c133b]">
          How was your clean?
        </h1>
        <p className="mt-4 text-base leading-7 text-[#5a5470]">
          Tell us in your own words.
        </p>
        <div className="mt-8">
          <GuestFeedbackForm />
        </div>
      </div>
    </main>
  );
}
