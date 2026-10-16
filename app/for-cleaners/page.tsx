import type { Metadata } from "next";
import Image from "next/image";

import {
  BrandedCtaBand,
  BrandedPageWash,
} from "@/components/marketing/branded-page-sections";
import { ForCleanersHero } from "@/components/marketing/for-cleaners-hero";
import { MarketingShell } from "@/components/marketing/marketing-shell";
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
    icon: "/images/marketing/icons/job-clarity.png",
    title: "Job clarity",
  },
  {
    body: "Complete identity and DBS document upload, set services and availability, then get reviewed before going live.",
    icon: "/images/marketing/icons/onboarding.png",
    title: "Simple onboarding",
  },
  {
    body: "Follow checklists, share status and message customers in-app — no private off-platform negotiation.",
    icon: "/images/marketing/icons/tools.png",
    title: "Professional tools",
  },
  {
    body: "Connect Stripe Express, choose weekly or monthly preference and track earnings in your cleaner dashboard.",
    icon: "/images/marketing/icons/payouts.png",
    title: "Visible payouts",
  },
];

export default function ForCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const signupHref = configured ? "/signup/cleaner" : "/setup";

  return (
    <MarketingShell loginHref={configured ? "/login/cleaner" : "/setup"}>
      <BrandedPageWash underNav>
        <ForCleanersHero
          description="Mundoria is building a marketplace where independent cleaners get clearer work, fairer reviews and payout visibility — starting in Birmingham."
          eyebrow="Cleaners"
          primaryHref={signupHref}
          primaryLabel="Apply as a cleaner"
          secondaryHref="/how-it-works"
          secondaryLabel="How it works"
          title="Work with Mundoria"
        />

        <section className="bg-[#f4ebfe] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-3xl divide-y divide-[#1c133b]/15">
            {benefits.map((item) => (
              <article
                className="flex items-start gap-5 py-8 first:pt-0 last:pb-0 sm:gap-6"
                key={item.title}
              >
                <Image
                  alt=""
                  className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-full object-cover sm:h-[5.5rem] sm:w-[5.5rem]"
                  height={512}
                  loading="eager"
                  src={item.icon}
                  width={512}
                />
                <div className="min-w-0 pt-1">
                  <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
                    {item.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#4e4860]">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <BrandedCtaBand
          body="Create a cleaner account, complete onboarding and wait for admin approval before jobs appear in your feed."
          buttonClassName="bg-[#1c133b] text-white hover:bg-[#312c79]"
          href={signupHref}
          label="Create cleaner account"
          title="Ready to join?"
          tone="white"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
