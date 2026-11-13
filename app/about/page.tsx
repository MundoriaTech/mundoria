import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandedCtaBand } from "@/components/marketing/branded-page-sections";
import { JsonLd } from "@/components/marketing/json-ld";
import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
import { GOOGLE_REVIEWS_LISTING_URL } from "@/lib/google/place-reviews";
import {
  MUNDORIA_IDENTITY,
  companyRegistrationSentence,
} from "@/lib/seo/identity";
import { LAUNCH_CITY } from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { organizationRef, organizationSchema } from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria is a Birmingham cleaning marketplace for vetted independent cleaners: who we are, how it works, how cleaners are vetted and how to reach us.",
  path: "/about",
  title: "About Mundoria | Birmingham Cleaning Marketplace",
});

const PILLARS = [
  {
    body: "Mundoria is a marketplace, not a cleaning agency. The cleaners you book are independent professionals. We vet them, match them to jobs, handle payment and keep you updated until the visit is done.",
    href: "/how-it-works",
    hrefLabel: "How it works",
    icon: "/images/marketing/icons/simple.png",
    title: "A marketplace, not an agency",
  },
  {
    body: "You see the full price before you confirm. Nothing is charged when you book. A temporary hold goes on once a cleaner is assigned, and payment is taken the day after the clean.",
    href: "/help/article/why-pay-in-advance",
    hrefLabel: "Why we hold payment",
    icon: "/images/marketing/icons/payouts.png",
    title: "Clear pricing, pay after",
  },
  {
    body: "Onboarding can include identity checks, right-to-work and DBS where they apply, insurance and references, then an appointment, training and assessment with the Mundoria team.",
    href: "/help/article/who-are-mundoria-cleaners",
    hrefLabel: "Who Mundoria cleaners are",
    icon: "/images/marketing/icons/onboarding.png",
    title: "Vetted before they go live",
  },
] as const;

const linkClass =
  "font-semibold text-[#6a45b8] underline-offset-2 hover:underline";

export default async function AboutPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const from = houseCleaningFromLabel(await loadServicePricing());

  return (
    <MarketingShell>
      <JsonLd
        data={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            about: organizationRef(),
            description:
              "Who Mundoria is, how the marketplace works, how cleaners are vetted and how to contact the team.",
            inLanguage: "en-GB",
            name: "About Mundoria",
            url: absoluteUrl("/about"),
          },
        ]}
      />

      <section
        className="relative isolate overflow-hidden"
        style={{
          backgroundColor: LANDING_PURPLE,
          marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})`,
        }}
      >
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/images/marketing/landing/residential-hero.jpg"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(31,24,58,0.92) 0%, rgba(63,53,98,0.78) 42%, rgba(63,53,98,0.35) 100%)",
          }}
        />
        <div
          className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-20 lg:min-h-[min(36rem,78dvh)] lg:pb-24"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 3.5rem)` }}
        >
          <p className="text-[1.35rem] font-semibold tracking-[-0.06em] text-white sm:text-[1.55rem]">
            Mundoria
          </p>
          <h1 className="mt-4 max-w-xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:text-[3.5rem] lg:text-[4rem]">
            Cleaning with a visible standard
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/85 sm:text-[1.05rem] sm:leading-8">
            We connect {LAUNCH_CITY.name} homes and workplaces with vetted
            independent cleaners, with clear prices, live updates and payment
            through the platform.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[#1c133b] transition duration-200 hover:scale-[1.02] hover:bg-[#f3eef8] active:scale-[0.98] touch-manipulation"
              href={bookingHref}
            >
              Book a clean
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 px-8 text-[15px] font-semibold text-white transition hover:bg-white/10 touch-manipulation"
              href="/how-it-works"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="about-pillars-heading"
        className="bg-[#f4ebfe] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]"
            id="about-pillars-heading"
          >
            What Mundoria is
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#4e4860]">
            House cleaning from {from}. Coverage across {LAUNCH_CITY.name} and
            nearby West Midlands towns, for homes, moves, short-lets, workplaces
            and recovery support.
          </p>
          <div className="mt-10 divide-y divide-[#1c133b]/15">
            {PILLARS.map((item) => (
              <ScrollReveal key={item.title}>
                <article className="flex items-start gap-5 py-8 first:pt-0 last:pb-0 sm:gap-6">
                  <Image
                    alt=""
                    className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-full object-cover sm:h-[5.5rem] sm:w-[5.5rem]"
                    height={512}
                    src={item.icon}
                    width={512}
                  />
                  <div className="min-w-0 pt-1">
                    <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[1.65rem]">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[#4e4860]">
                      {item.body}
                    </p>
                    <Link className={`mt-3 inline-block ${linkClass}`} href={item.href}>
                      {item.hrefLabel}
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5a5470]">
            Browse{" "}
            <Link className={linkClass} href="/cleaners/birmingham">
              areas we cover
            </Link>{" "}
            and{" "}
            <Link className={linkClass} href="/cleaning">
              every service
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        aria-labelledby="about-trust-heading"
        className="bg-white px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div>
            <h2
              className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]"
              id="about-trust-heading"
            >
              Reviews you can trust
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#5a5470]">
              We only publish reviews written by customers after a completed
              booking, and we never filter out critical ones. You can also read
              what people say about Mundoria on Google.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#1c133b] px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f5fb]"
              href={GOOGLE_REVIEWS_LISTING_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read Google reviews
            </Link>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[18rem]">
            <Image
              alt=""
              className="object-contain"
              fill
              sizes="288px"
              src="/images/marketing/icons/reliable.png"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="about-contact-heading"
        className="border-t border-[#ebe6f2] bg-[#faf8ff] px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]"
            id="about-contact-heading"
          >
            Company details and contact
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5a5470]">
            {companyRegistrationSentence()}
          </p>
          <ul className="mt-8 flex flex-col items-center gap-3 text-[15px] leading-7 text-[#5a5470]">
            <li>
              <a
                className={linkClass}
                href={`mailto:${MUNDORIA_IDENTITY.supportEmail}`}
              >
                {MUNDORIA_IDENTITY.supportEmail}
              </a>
            </li>
            <li>
              <a
                className={linkClass}
                href={`tel:${MUNDORIA_IDENTITY.phone.replace(/\s+/g, "")}`}
              >
                {MUNDORIA_IDENTITY.phone}
              </a>
            </li>
          </ul>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ContactSupportButton
              className="inline-flex h-12 min-w-[10.5rem] items-center justify-center rounded-full bg-[#1c133b] px-8 text-sm font-semibold text-white transition hover:bg-[#15102e]"
              label="Contact us"
              tab="home"
            />
            <Link
              className="inline-flex h-12 min-w-[10.5rem] items-center justify-center rounded-full border border-[#1c133b] bg-white px-8 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f5fb]"
              href="/help"
            >
              Help Centre
            </Link>
          </div>
        </div>
      </section>

      <BrandedCtaBand
        body={`Tell us what you need and see your price before you book. House cleaning from ${from}.`}
        href={bookingHref}
        label="Book a clean"
        title="Ready when you are"
      />
    </MarketingShell>
  );
}
