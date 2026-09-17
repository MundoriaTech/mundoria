import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { MARKETING_FAQS } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Answers about Mundoria booking, pricing, coverage in Birmingham, cleaner vetting, cancellations and support.",
  path: "/faq",
  title: "FAQ | Mundoria",
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
      <BrandedPageWash>
        <MarketingHero
          description="Straight answers about booking, pricing, Birmingham coverage and becoming a cleaner."
          eyebrow="Help"
          primaryHref={bookingHref}
          primaryLabel="Book a clean"
          secondaryHref="/contact"
          secondaryLabel="Contact us"
          title="Frequently asked questions"
        />

        <BrandedSection>
          <div className="columns-1 gap-4 sm:columns-2">
            {MARKETING_FAQS.map((item) => (
              <article
                className="mb-4 break-inside-avoid rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/90 px-5 py-5 shadow-[0_10px_28px_rgba(49,44,121,0.06)] sm:mb-5 sm:px-6 sm:py-6"
                key={item.question}
              >
                <h2 className="text-[15px] font-bold leading-snug text-[#1c133b] sm:text-base">
                  {item.question}
                </h2>
                <p className="mt-2.5 text-sm leading-6 text-[#5a5470]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-[#5a5470]">
            Still stuck?{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/contact"
            >
              Contact us
            </Link>{" "}
            or read{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/privacy"
            >
              privacy
            </Link>{" "}
            and{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/terms"
            >
              terms
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedCtaBand
          body="Get a clear estimate before you book — then track the clean from match to checklist."
          href={bookingHref}
          label="Book a clean"
          title="Ready to book?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
