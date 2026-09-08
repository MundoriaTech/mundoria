import type { Metadata } from "next";

import { CommercialCleaningPage } from "@/components/marketing/commercial/commercial-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Commercial cleaning with CleanScape — office, retail & hospitality, educational and communal area cleans with clear pricing and vetted cleaners in Birmingham.",
  path: "/cleaning/commercial",
  title: "Commercial Cleaning | CleanScape",
});

export default function CommercialCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=commercial"
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
            "Commercial cleaning for offices, retail, education and communal spaces.",
          name: "Commercial Cleaning",
          provider: {
            "@type": "Organization",
            name: "CleanScape",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/commercial"),
        }}
      />
      <CommercialCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
