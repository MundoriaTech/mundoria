import type { Metadata } from "next";

import { CategoryMagLinks } from "@/components/marketing/category-mag-links";
import { ShortLetsCleaningPage } from "@/components/marketing/short-lets/short-lets-cleaning-page";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { loadPageDirectoryContent } from "@/lib/marketing/page-directory";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { organizationRef } from "@/lib/seo/structured-data";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  description:
    "Airbnb and short-let cleaning with Mundoria: guest-ready turnovers for Airbnb, holiday lets and serviced accommodation in Birmingham.",
  path: "/cleaning/short-lets",
  title: "Airbnb & Short Lets Cleaning | Mundoria",
});

export default async function ShortLetsCleaningRoute() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured
    ? "/booking/new?category=short_term_rental&returnTo=/cleaning/short-lets"
    : "/setup";
  const { cleaners, reviews } = await loadPageDirectoryContent({
    category: "short_term_rental",
  });

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
          provider: organizationRef(),
          url: absoluteUrl("/cleaning/short-lets"),
        }}
      />
      <ShortLetsCleaningPage
        bookingHref={bookingHref}
        cleaners={cleaners}
        reviews={reviews}
      />
      <CategoryMagLinks category="short_term_rental" />
    </MarketingShell>
  );
}
