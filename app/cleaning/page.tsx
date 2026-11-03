import type { Metadata } from "next";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ServicesIndexPage } from "@/components/marketing/services/services-index-page";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const cleaningCopy = onpageCopyForPath("/cleaning")!;

export const metadata: Metadata = buildPageMetadata({
  description: cleaningCopy.description,
  path: "/cleaning",
  title: cleaningCopy.title,
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
