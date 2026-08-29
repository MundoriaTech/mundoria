import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Become a CleanScape cleaner in Birmingham. Flexible jobs, clear checklists, in-app messaging and Stripe Connect payouts after onboarding and vetting.",
  path: "/for-cleaners",
  title: "Become a Cleaner | CleanScape",
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
      <MarketingHero
        description="CleanScape is building a marketplace where independent cleaners get clearer work, fairer reviews and payout visibility — starting in Birmingham."
        eyebrow="Cleaners"
        primaryHref={signupHref}
        primaryLabel="Apply as a cleaner"
        secondaryHref="/how-it-works"
        secondaryLabel="See the customer journey"
        title="Work with CleanScape"
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {benefits.map((item) => (
            <article
              className="rounded-[1.5rem] border border-border bg-card p-7"
              key={item.title}
            >
              <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-7xl rounded-[1.5rem] bg-foreground px-6 py-10 text-background sm:flex sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              Ready to join?
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-background/70">
              Create a cleaner account, complete onboarding and wait for admin
              approval before jobs appear in your feed.
            </p>
          </div>
          <Button
            asChild
            className="mt-6 h-12 rounded-full bg-background px-6 font-black text-foreground hover:bg-background/90 sm:mt-0"
          >
            <Link href={signupHref}>Create cleaner account</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
