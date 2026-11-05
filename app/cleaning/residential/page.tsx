import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { ResidentialCleaningPage } from "@/components/marketing/residential/residential-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

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
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl("/cleaning/residential"),
          },
          launchCityFaqJsonLd(),
        ]}
      />
      <ResidentialCleaningPage bookingHref={bookingHref} />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="residential"
          showAreaCards={false}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
