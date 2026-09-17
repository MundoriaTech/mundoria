import type { Metadata } from "next";
import Link from "next/link";

import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { SUPPORT_EMAIL, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Contact Mundoria — join as a cleaner, press enquiries, or get in touch about bookings and partnerships.",
  path: "/contact",
  title: "Contact us | Mundoria",
});

const CONTACT_CARDS = [
  {
    body: "Independent cleaners who want flexible jobs, clear checklists and visible payouts can apply to join Mundoria.",
    cta: "Apply as a cleaner",
    href: "/for-cleaners",
    title: "Want to become a Mundoria cleaner?",
  },
  {
    body: "Journalists and creators — we can share how Mundoria helps customers book cleaning with clearer next steps, and how partners earn on the platform.",
    cta: "Email press",
    href: "mailto:hello@mundoriauk.com",
    title: "Are you a journalist or blogger?",
  },
  {
    body: "Questions about a booking, partnership idea, or something else? Write to us and we’ll point you to the right place.",
    cta: "Email support",
    href: `mailto:${SUPPORT_EMAIL}`,
    title: "Simply want to get in touch?",
  },
] as const;

export default function ContactPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

  return (
    <MarketingShell>
      <BrandedPageWash>
        <MarketingHero
          description="Whether you’re booking a clean, joining as a cleaner, or writing about Mundoria — here’s how to reach us."
          eyebrow="Contact"
          primaryHref={bookingHref}
          primaryLabel="Book a clean"
          secondaryHref="/faq"
          secondaryLabel="Read FAQ"
          title="Contact us"
        />

        <BrandedSection>
          <div className="grid gap-4 md:grid-cols-3">
            {CONTACT_CARDS.map((card) => (
              <article
                className="flex h-full flex-col rounded-[1.5rem] border border-[#e4daf5]/80 bg-white/90 p-6 shadow-[0_12px_32px_rgba(49,44,121,0.07)]"
                key={card.title}
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
                  {card.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#5a5470]">
                  {card.body}
                </p>
                <Link
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#6a45b8] px-5 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
                  href={card.href}
                >
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[1.5rem] bg-[#efe6ff] px-6 py-7 sm:px-8">
            <h2 className="text-lg font-semibold text-[#1c133b]">
              For active bookings
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
              The fastest help is in your Mundoria account — open the booking and
              use in-app messaging so the right team can see the full context.
              General enquiries:{" "}
              <a
                className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-4 text-sm text-[#5a5470]">
              We don’t take bookings by phone. Book online for a clear estimate
              and live status.
            </p>
          </div>
        </BrandedSection>

        <BrandedCtaBand
          body="Tell us about your space and we’ll show clear next steps before you confirm."
          href={bookingHref}
          label="Book a clean"
          title="Ready when you are."
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
