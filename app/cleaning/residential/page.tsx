import type { Metadata } from "next";

import { ResidentialCleaningPage } from "@/components/marketing/residential/residential-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Residential cleaning with Mundoria — regular, deep and one-off cleans with clear pricing and vetted cleaners in Birmingham.",
  path: "/cleaning/residential",
  title: "Residential Cleaning | Mundoria",
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
            "Residential cleaning for everyday homes, deep resets and flexible one-off visits.",
          name: "Residential Cleaning",
          provider: {
            "@type": "Organization",
            name: "Mundoria",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/residential"),
        }}
      />
      <ResidentialCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
