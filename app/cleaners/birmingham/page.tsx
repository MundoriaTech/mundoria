import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
} from "@/components/marketing/branded-page-sections";
import { LaunchCityHubSections } from "@/components/marketing/launch-city-hub-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PlaceMapHero } from "@/components/marketing/place-map-hero";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { birminghamPlaceFaqSchemaAnswers } from "@/lib/seo/birmingham-place-faqs";
import { LAUNCH_CITY } from "@/lib/seo/marketing";
import {
  birminghamAreasServed,
  organizationRef,
} from "@/lib/seo/structured-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  description: LAUNCH_CITY.seoDescription,
  path: `/cleaners/${LAUNCH_CITY.slug}`,
  title: "Cleaners in Birmingham | Mundoria",
});

export default async function BirminghamCleanersPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const pricing = await loadServicePricing();

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
            "@type": "Service",
            areaServed: birminghamAreasServed(),
            description: LAUNCH_CITY.seoDescription,
            name: "House cleaning in Birmingham",
            provider: organizationRef(),
            serviceType: "House cleaning",
            url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: birminghamPlaceFaqSchemaAnswers(
              "Birmingham",
              pricing,
            ).map((item) => ({
              "@type": "Question",
              acceptedAnswer: { "@type": "Answer", text: item.answer },
              name: item.question,
            })),
          },
        ]}
      />

      <PlaceMapHero
        bullets={[
          "One-off or regular house cleaning",
          "Clear estimates before you book",
          "Reliable, vetted cleaners you can trust",
        ]}
        description="One-off or regular house cleaning with tried & vetted cleaners in your area, clear estimates from booking to checklist."
        primaryHref={bookingHref}
        primaryLabel="Book in Birmingham"
        showReviews
        title="House cleaners in Birmingham"
      />

      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="residential"
          cleanerLimit={18}
          showAreaCards={false}
        />

        <BrandedCtaBand
          body="Enter your Birmingham postcode and service, we’ll show a clear estimate before you book."
          href={bookingHref}
          label="Book in Birmingham"
          title="Ready to book in Birmingham?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
