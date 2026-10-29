import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { CommercialCleaningPage } from "@/components/marketing/commercial/commercial-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Workspace cleaning with Mundoria — office, retail & hospitality, educational and communal area cleans with clear pricing and vetted cleaners in Birmingham.",
  path: "/cleaning/commercial",
  title: "Workspace Cleaning | Mundoria",
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
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl("/cleaning/commercial"),
          },
          launchCityFaqJsonLd(),
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
