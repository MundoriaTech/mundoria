import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS_STEPS } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See how CleanScape booking works — choose a service, get a clear estimate, book securely and track the clean from match to checklist completion.",
  path: "/how-it-works",
  title: "How CleanScape Works | CleanScape",
});

export default function HowItWorksPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

  return (
    <MarketingShell>
      <MarketingHero
        description="CleanScape is designed so customers never feel like they’re filling in an insurance form — tell us what you need, see a clear estimate, then book."
        eyebrow="Product"
        primaryHref={bookingHref}
        primaryLabel="Start booking"
        secondaryHref="/faq"
        secondaryLabel="Read FAQ"
        title="How CleanScape works"
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article
              className="rounded-[1.5rem] border border-border bg-card p-7"
              key={step.title}
            >
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                Step {index + 1}
              </p>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-foreground">
                {step.title}
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                {step.body}
              </p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-7xl rounded-[1.5rem] bg-foreground px-6 py-10 text-background sm:px-10">
          <h2 className="text-3xl font-black tracking-[-0.04em]">
            From booking to cleaner confirmed
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium text-background/70">
            After payment, your booking enters matching. Once a cleaner accepts,
            you see confirmation details and can follow status through arrival
            and completion.
          </p>
          <Button
            asChild
            className="mt-6 h-12 rounded-full bg-background px-6 font-black text-foreground hover:bg-background/90"
          >
            <Link href={bookingHref}>Book a clean</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
