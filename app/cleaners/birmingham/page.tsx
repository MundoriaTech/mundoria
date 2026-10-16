import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
} from "@/components/marketing/branded-page-sections";
import { LaunchCityHubSections } from "@/components/marketing/launch-city-hub-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PlaceMapHero } from "@/components/marketing/place-map-hero";
import { birminghamPlaceFaqSchemaAnswers } from "@/lib/seo/birmingham-place-faqs";
import { BIRMINGHAM_AREAS, LAUNCH_CITY } from "@/lib/seo/marketing";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description: LAUNCH_CITY.seoDescription,
  path: `/cleaners/${LAUNCH_CITY.slug}`,
  title: "Cleaners in Birmingham | Mundoria",
});

export default async function BirminghamCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

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
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: birminghamPlaceFaqSchemaAnswers("Birmingham").map(
              (item) => ({
                "@type": "Question",
                acceptedAnswer: { "@type": "Answer", text: item.answer },
                name: item.question,
              }),
            ),
          },
        ]}
      />

      <PlaceMapHero
        bullets={[
          "One-off or regular house cleaning",
          "Clear estimates before you book",
          "Reliable, vetted cleaners you can trust",
        ]}
        description="One-off or regular house cleaning with tried & vetted cleaners in your area — clear estimates from booking to checklist."
        primaryHref={bookingHref}
        primaryLabel="Book in Birmingham"
        showReviews
        title="Domestic cleaners in Birmingham"
      />

      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="residential"
          cleanerLimit={18}
          showAreaCards={false}
        />

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
