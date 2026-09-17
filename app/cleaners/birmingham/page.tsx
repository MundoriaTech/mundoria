import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCardLink,
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  LocationFaqBlock,
  LocationFeaturedCleaners,
  LocationHowToBook,
  LocationReviews,
  LocationServicesExplainer,
  LocationTrustStrip,
  LocationWhatsCovered,
} from "@/components/marketing/location-seo-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import {
  BIRMINGHAM_LOCATION_CLEANERS,
  BIRMINGHAM_LOCATION_REVIEWS,
} from "@/lib/seo/location-social-proof";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description: LAUNCH_CITY.seoDescription,
  path: `/cleaners/${LAUNCH_CITY.slug}`,
  title: "Cleaners in Birmingham | Mundoria",
});

export default function BirminghamCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const popular = popularMarketingServices();

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                item: absoluteUrl("/"),
                name: "Home",
                position: 1,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
                name: "Cleaners in Birmingham",
                position: 2,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Birmingham",
              addressCountry: "GB",
            },
            areaServed: BIRMINGHAM_AREAS.map((area) => ({
              "@type": "Place",
              name: area.name,
            })),
            description: LAUNCH_CITY.seoDescription,
            name: "Mundoria Birmingham",
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
          },
        ]}
      />

      <BrandedPageWash>
        <MarketingHero
          description="One-off or regular house cleaning with tried & vetted cleaners in your area — clear estimates from booking to checklist."
          eyebrow="Birmingham · From clear online estimates"
          primaryHref={bookingHref}
          primaryLabel="Book in Birmingham"
          secondaryHref="/cleaning"
          secondaryLabel="Browse services"
          title="Domestic cleaners in Birmingham"
        />

        <LocationTrustStrip />

        <LocationFeaturedCleaners
          cleaners={[...BIRMINGHAM_LOCATION_CLEANERS]}
          place="Birmingham"
        />

        <BrandedSection>
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Neighbourhoods we prioritise
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
            Mundoria cleaners are available in these Birmingham areas and their
            surroundings:
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIRMINGHAM_AREAS.map((area) => (
              <BrandedCardLink
                description={area.description}
                href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`}
                key={area.slug}
                label={area.name}
                meta="Birmingham"
              />
            ))}
          </div>
        </BrandedSection>

        <BrandedSection tone="lavender">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Looking for something different in cleaning?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((service) => (
              <BrandedCardLink
                description={`From ${service.fromPrice}`}
                href={`/cleaning/${service.slug}`}
                key={service.slug}
                label={`${service.label} in Birmingham`}
                meta={service.categoryLabel}
              />
            ))}
          </div>
        </BrandedSection>

        <LocationReviews
          place="Birmingham"
          reviews={[...BIRMINGHAM_LOCATION_REVIEWS]}
        />

        <LocationServicesExplainer place="Birmingham" />
        <LocationWhatsCovered place="Birmingham" />
        <LocationHowToBook place="Birmingham" />
        <LocationFaqBlock place="Birmingham" />

        <BrandedSection tone="cream">
          <h2 className="text-[1.35rem] font-semibold text-[#1c133b]">
            From the Mundoria Mag
          </h2>
          <p className="mt-2 text-sm text-[#5a5470]">
            Tips for hosts, households and cleaners —{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/blog"
            >
              read the blog
            </Link>
            .
          </p>
        </BrandedSection>

        <BrandedCtaBand
          body="Enter your Birmingham postcode and service — we’ll show a clear estimate before you book."
          href={bookingHref}
          label="Book in Birmingham"
          title="Ready to book in Birmingham?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
