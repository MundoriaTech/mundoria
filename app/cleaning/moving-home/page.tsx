import type { Metadata } from "next";

import { MovingHomeCleaningPage } from "@/components/marketing/moving-home/moving-home-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Moving home cleaning with CleanScape — end of tenancy, move-in and move-out cleans with clear pricing and vetted cleaners in Birmingham.",
  path: "/cleaning/moving-home",
  title: "Moving Home Cleaning | CleanScape",
});

export default function MovingHomeCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=moving_home"
    : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          areaServed: { "@type": "City", name: "Birmingham" },
          description:
            "End of tenancy, move-in and move-out cleaning for handovers.",
          name: "Moving Home Cleaning",
          provider: {
            "@type": "Organization",
            name: "CleanScape",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/moving-home"),
        }}
      />
      <MovingHomeCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
