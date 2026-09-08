import type { Metadata } from "next";

import { ResidentialCleaningPage } from "@/components/marketing/residential/residential-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Residential cleaning with CleanScape — regular, one-off, deep, move-in/out and end-of-tenancy cleans with clear pricing and vetted cleaners.",
  path: "/cleaning/residential",
  title: "Residential Cleaning | CleanScape",
});

export default function ResidentialCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=residential"
    : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          areaServed: {
            "@type": "City",
            name: "Birmingham",
          },
          description:
            "Residential cleaning for everyday homes, deep resets, move-ins and tenancy handovers.",
          name: "Residential Cleaning",
          provider: {
            "@type": "Organization",
            name: "CleanScape",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/residential"),
        }}
      />
      <ResidentialCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
