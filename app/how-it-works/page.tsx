import type { Metadata } from "next";

import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { HOW_IT_WORKS_STEPS } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See how Mundoria booking works — choose a service, get a clear estimate, book securely and track the clean from match to checklist completion.",
  path: "/how-it-works",
  title: "How Mundoria Works | Mundoria",
});

export default function HowItWorksPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

  return (
    <MarketingShell>
      <BrandedPageWash>
        <MarketingHero
          description="Mundoria is designed so customers never feel like they’re filling in an insurance form — tell us what you need, see a clear estimate, then book."
          eyebrow="Product"
          primaryHref={bookingHref}
          primaryLabel="Start booking"
          secondaryHref="/faq"
          secondaryLabel="Read FAQ"
          title="How Mundoria works"
        />

        <BrandedSection>
          <div className="grid gap-4 md:grid-cols-2">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <article
                className="rounded-[1.5rem] border border-[#e4daf5]/80 bg-white/90 p-6 shadow-[0_12px_32px_rgba(49,44,121,0.07)] sm:p-7"
                key={step.title}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#823fb2]">
                  Step {index + 1}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#5a5470]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </BrandedSection>

        <BrandedCtaBand
          body="After payment, your booking enters matching. Once a cleaner accepts, you see confirmation and live status through arrival and completion."
          href={bookingHref}
          label="Book a clean"
          title="From booking to cleaner confirmed"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
