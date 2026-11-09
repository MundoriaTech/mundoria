import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { CommercialCleaningPage } from "@/components/marketing/commercial/commercial-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { organizationRef } from "@/lib/seo/structured-data";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

const commercialCopy = onpageCopyForPath("/cleaning/commercial")!;

export const metadata: Metadata = buildPageMetadata({
  description: commercialCopy.description,
  path: "/cleaning/commercial",
  title: commercialCopy.title,
});

export default async function CommercialCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=commercial&returnTo=/cleaning/commercial"
    : "/setup";

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
              "Workspace cleaning for offices, retail, education and communal spaces.",
            name: "Workspace Cleaning",
            provider: organizationRef(),
            url: absoluteUrl("/cleaning/commercial"),
          },
          await launchCityFaqJsonLd(),
        ]}
      />
      <CommercialCleaningPage bookingHref={bookingHref} />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="commercial"
          showAreaCards={false}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
