import type { Metadata } from "next";

import { ShortLetsCleaningPage } from "@/components/marketing/short-lets/short-lets-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Airbnb and short-let cleaning with CleanScape — guest-ready turnovers for Airbnb, holiday lets and serviced accommodation in Birmingham.",
  path: "/cleaning/short-lets",
  title: "Airbnb & Short Lets Cleaning | CleanScape",
});

export default function ShortLetsCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=short_term_rental"
    : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          areaServed: { "@type": "City", name: "Birmingham" },
          description:
            "Guest-ready cleaning for Airbnb, holiday lets and serviced accommodation.",
          name: "Airbnb & Short Lets Cleaning",
          provider: {
            "@type": "Organization",
            name: "CleanScape",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/short-lets"),
        }}
      />
      <ShortLetsCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
