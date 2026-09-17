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
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Become a Mundoria cleaner in Birmingham. Flexible jobs, clear checklists, in-app messaging and Stripe Connect payouts after onboarding and vetting.",
  path: "/for-cleaners",
  title: "Become a Cleaner | Mundoria",
});

const benefits = [
  {
    body: "See eligible jobs in your working areas, accept work that fits your schedule and keep a clear calendar.",
    title: "Job clarity",
  },
  {
    body: "Complete identity and DBS document upload, set services and availability, then get reviewed before going live.",
    title: "Simple onboarding",
  },
  {
    body: "Follow checklists, share status and message customers in-app — no private off-platform negotiation.",
    title: "Professional tools",
  },
  {
    body: "Connect Stripe Express, choose weekly or monthly preference and track earnings in your cleaner dashboard.",
    title: "Visible payouts",
  },
];

export default function ForCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const signupHref = configured ? "/signup" : "/setup";

  return (
    <MarketingShell>
      <BrandedPageWash>
        <MarketingHero
          description="Mundoria is building a marketplace where independent cleaners get clearer work, fairer reviews and payout visibility — starting in Birmingham."
          eyebrow="Cleaners"
          primaryHref={signupHref}
          primaryLabel="Apply as a cleaner"
          secondaryHref="/how-it-works"
          secondaryLabel="See the customer journey"
          title="Work with Mundoria"
        />

        <BrandedSection>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <article
                className="rounded-[1.5rem] border border-[#e4daf5]/80 bg-white/90 p-6 shadow-[0_12px_32px_rgba(49,44,121,0.07)] sm:p-7"
                key={item.title}
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#5a5470]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </BrandedSection>

        <BrandedCtaBand
          body="Create a cleaner account, complete onboarding and wait for admin approval before jobs appear in your feed."
          href={signupHref}
          label="Create cleaner account"
          title="Ready to join?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
