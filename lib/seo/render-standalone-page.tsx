import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { loadPageDirectoryContent } from "@/lib/marketing/page-directory";
import { organizationRef } from "@/lib/seo/structured-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import {
  STANDALONE_PAGES,
  standaloneBookingHref,
  standalonePageBySlug,
  type StandalonePageDef,
} from "@/lib/seo/standalone-pages";

function relatedCards(page: StandalonePageDef) {
  return STANDALONE_PAGES.filter((item) => item.slug !== page.slug)
    .slice(0, 6)
    .map((item) => ({
      href: item.path,
      image: item.cardImage,
      label: item.title,
    }));
}

export function standalonePageMetadata(slug: string): Metadata {
  const page = standalonePageBySlug(slug);
  if (!page) return {};
  return buildPageMetadata({
    description: page.description,
    path: page.path,
    title: page.metaTitle,
  });
}

export async function renderStandalonePage(slug: string) {
  const page = standalonePageBySlug(slug);
  if (!page) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = standaloneBookingHref(page, configured);
  const { cleaners, reviews } = await loadPageDirectoryContent({
    category:
      page.addOnId === "linen_change" ||
      page.addOnId === "balcony_patio" ||
      page.addOnId === "inside_cabinets" ||
      page.addOnId === "extra_bathroom_detail"
        ? "short_term_rental"
        : "residential",
  });

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          areaServed: { "@type": "City", name: "Birmingham" },
          description: page.description,
          name: page.title,
          provider: organizationRef(),
          serviceType: page.title,
          url: absoluteUrl(page.path),
        }}
      />
      <ServiceCategoryMarketingPage
        bookingHref={bookingHref}
        cleaners={cleaners}
        config={{
          bookCta: page.bookCta,
          bullets: page.bullets,
          faqs: page.faqs,
          faqsTitle: `About ${page.title.toLowerCase()}`,
          faqVariant: "service",
          heroImage: page.heroImage,
          serviceCards: relatedCards(page),
          servicesTitle:
            page.kind === "domestic"
              ? "Related services and extras"
              : "More extras and domestic cleaning",
          subtitle: page.subtitle,
          title: page.title,
        }}
        reviews={reviews}
      />
    </MarketingShell>
  );
}
