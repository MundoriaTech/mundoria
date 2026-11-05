import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import { RecoveryCleaningPage } from "@/components/marketing/recovery/recovery-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const recoveryCopy = onpageCopyForPath("/cleaning/recovery")!;

export const metadata: Metadata = buildPageMetadata({
  description: recoveryCopy.description,
  path: "/cleaning/recovery",
  title: recoveryCopy.title,
});

export default async function RecoveryCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=recovery&returnTo=/cleaning/recovery"
    : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: { "@type": "City", name: "Birmingham" },
            description:
              "Cleaning that adapts when life does, with more personal consideration.",
            name: "Recovery cleaning",
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl("/cleaning/recovery"),
          },
          await launchCityFaqJsonLd(),
        ]}
      />
      <RecoveryCleaningPage bookingHref={bookingHref} />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus="recovery"
          showAreaCards={false}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
