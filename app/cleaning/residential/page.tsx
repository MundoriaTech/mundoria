import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { ResidentialCleaningPage } from "@/components/marketing/residential/residential-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
import { loadPageDirectoryContent } from "@/lib/marketing/page-directory";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { organizationRef } from "@/lib/seo/structured-data";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

const residentialCopy = onpageCopyForPath("/cleaning/residential")!;

export const metadata: Metadata = buildPageMetadata({
  description: residentialCopy.description,
  path: "/cleaning/residential",
  title: residentialCopy.title,
});

export default async function ResidentialCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=residential&returnTo=/cleaning/residential"
    : "/setup";
  const fromRateLabel = houseCleaningFromLabel(await loadServicePricing());
  const { cleaners, reviews } = await loadPageDirectoryContent({
    category: "residential",
  });

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: {
              "@type": "City",
              name: "Birmingham",
            },
            description:
              "House cleaning for everyday homes, deep resets and flexible one-off visits.",
            name: "House Cleaning",
            provider: organizationRef(),
            url: absoluteUrl("/cleaning/residential"),
          },
          await launchCityFaqJsonLd(),
        ]}
      />
      <ResidentialCleaningPage
        bookingHref={bookingHref}
        cleaners={cleaners}
        fromRateLabel={fromRateLabel}
        reviews={reviews}
      />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="residential"
          showAreaCards={false}
          showFeatured={false}
          showReviews={false}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
