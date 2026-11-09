import type { Metadata } from "next";
import Link from "next/link";

import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { JsonLd } from "@/components/marketing/json-ld";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
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

const VETTING_STEPS = [
  "Identity verification",
  "Right-to-work checks, where they apply",
  "DBS checks, where they apply to the services a cleaner offers",
  "Insurance requirements, references and an experience review",
  "An appointment with the Mundoria team, then training and an assessment",
] as const;

const headingClass =
  "text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl";
const bodyClass = "mt-4 max-w-2xl text-[15px] leading-7 text-[#5a5470]";
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
      <BrandedPageWash underNav>
        <MarketingHero
          description="Mundoria is an online marketplace that connects people in Birmingham with vetted, independent cleaners. You see the price before you book, follow the visit live and pay through the platform."
          eyebrow="About us"
          primaryHref={bookingHref}
          primaryLabel="Book a clean"
          secondaryHref="/how-it-works"
          secondaryLabel="How it works"
          title="About Mundoria"
          underNav
        />
        <BrandedSection>
          <h2 className={headingClass}>What Mundoria is</h2>
          <p className={bodyClass}>
            Mundoria is a marketplace, not a cleaning agency. The cleaners you
            book are independent, self-employed professionals. Mundoria vets
            and onboards them, matches them to bookings, handles payment and
            support, and keeps you updated from the moment a cleaner accepts
            until the job is done.
          </p>
          <p className={bodyClass}>
            We cover {LAUNCH_CITY.name} and nearby West Midlands towns, for
            house cleaning, moving home, Airbnb and short-let turnovers,
            workspaces and recovery support. See{" "}
            <Link className={linkClass} href="/cleaners/birmingham">
              the areas we cover
            </Link>{" "}
            and{" "}
            <Link className={linkClass} href="/cleaning">
              every service
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedSection tone="cream">
          <h2 className={headingClass}>How pricing and payment work</h2>
          <p className={bodyClass}>
            Each service has an hourly rate; house cleaning starts from {from}.
            Your price is that rate multiplied by the hours your home needs,
            plus any add-ons and early, evening or weekend timing, and you see
            the full amount before you confirm.
          </p>
          <p className={bodyClass}>
            Nothing is charged when you book. About 24 hours before the visit,
            once a cleaner is confirmed, a hold is placed on your card, and the
            payment is taken the day after the clean. You never pay the cleaner
            directly.{" "}
            <Link className={linkClass} href="/help/article/why-pay-in-advance">
              Why we hold payment in advance
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedSection>
          <h2 className={headingClass}>How cleaners are vetted</h2>
          <p className={bodyClass}>
            Before a cleaner can take bookings, onboarding can include:
          </p>
          <ul className="mt-3 max-w-2xl list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-[#5a5470]">
            {VETTING_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p className={bodyClass}>
            Cleaners are approved for the types of cleaning they are suited to.
            Read more in{" "}
            <Link className={linkClass} href="/help/article/who-are-mundoria-cleaners">
              who Mundoria cleaners are
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedSection tone="cream">
          <h2 className={headingClass}>Reviews</h2>
          <p className={bodyClass}>
            We only publish reviews written by customers after a completed
            booking, and we never filter out critical ones. You can also read
            what customers say about Mundoria on Google.
          </p>
        </BrandedSection>

        <BrandedSection>
          <h2 className={headingClass}>Company details and contact</h2>
          <p className={bodyClass}>{companyRegistrationSentence()}</p>
          <ul className="mt-3 max-w-2xl space-y-1.5 text-[15px] leading-7 text-[#5a5470]">
            <li>
              Email:{" "}
              <a className={linkClass} href={`mailto:${MUNDORIA_IDENTITY.supportEmail}`}>
                {MUNDORIA_IDENTITY.supportEmail}
              </a>
            </li>
            <li>
              Phone:{" "}
              <a
                className={linkClass}
                href={`tel:${MUNDORIA_IDENTITY.phone.replace(/\s+/g, "")}`}
              >
                {MUNDORIA_IDENTITY.phone}
              </a>
            </li>
            <li>
              Live chat and support:{" "}
              <Link className={linkClass} href="/contact">
                Contact us
              </Link>
            </li>
          </ul>
        </BrandedSection>

        <BrandedCtaBand
          body={`Tell us what you need and see your price before you book. House cleaning from ${from}.`}
          href={bookingHref}
          label="Book a clean"
          title="Ready when you are"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
