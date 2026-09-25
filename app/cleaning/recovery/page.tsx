import type { Metadata } from "next";

import { RecoveryCleaningPage } from "@/components/marketing/recovery/recovery-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Recovery — personalised cleaning support for pregnancy, postpartum, illness, injury, hospital discharge and bereavement. Cleaning, not healthcare.",
  path: "/cleaning/recovery",
  title: "Mundoria Recovery | Mundoria",
});

export default function RecoveryCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=recovery&returnTo=/cleaning/recovery"
    : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          areaServed: { "@type": "City", name: "Birmingham" },
          description:
            "Cleaning that adapts when life does — with more personal consideration.",
          name: "Mundoria Recovery",
          provider: {
            "@type": "Organization",
            name: "Mundoria",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl("/cleaning/recovery"),
        }}
      />
      <RecoveryCleaningPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
