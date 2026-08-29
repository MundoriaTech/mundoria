import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { MARKETING_FAQS } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Answers about CleanScape booking, pricing, coverage in Birmingham, cleaner vetting, cancellations and support.",
  path: "/faq",
  title: "FAQ | CleanScape",
});

export default function FaqPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: MARKETING_FAQS.map((item) => ({
            "@type": "Question",
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
            name: item.question,
          })),
        }}
      />
      <MarketingHero
        description="Straight answers about booking, pricing, Birmingham coverage and becoming a cleaner."
        eyebrow="Help"
        primaryHref={bookingHref}
        primaryLabel="Book a clean"
        secondaryHref="/how-it-works"
        secondaryLabel="How it works"
        title="Frequently asked questions"
      />

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
          {MARKETING_FAQS.map((item) => (
            <article className="py-8" key={item.question}>
              <h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
                {item.question}
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link className="font-bold text-primary" href="mailto:support@cleanscapeuk.com">
            Email support
          </Link>{" "}
          or read{" "}
          <Link className="font-bold text-primary" href="/privacy">
            privacy
          </Link>{" "}
          and{" "}
          <Link className="font-bold text-primary" href="/terms">
            terms
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
