import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ServicesIndexPage } from "@/components/marketing/services/services-index-page";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Browse Mundoria cleaning services — residential, commercial, guest turns and Mundoria Recovery. Get a quote online and book with clear next steps.",
  path: "/cleaning",
  title: "Cleaning Services | Mundoria",
});

export default function CleaningIndexPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          description:
            "Mundoria cleaning services for homes, workplaces and guest turns.",
          name: "Mundoria Cleaning Services",
          url: absoluteUrl("/cleaning"),
        }}
      />
      <ServicesIndexPage bookingHref={bookingHref} />
    </MarketingShell>
  );
}
