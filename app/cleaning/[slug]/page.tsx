import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import {
  MARKETING_SERVICES,
  marketingServiceBySlug,
} from "@/lib/seo/marketing";
import { serviceDetailConfig } from "@/lib/seo/service-detail-config";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return MARKETING_SERVICES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  if (!service) return {};
  return buildPageMetadata({
    description: service.seoDescription,
    path: `/cleaning/${service.slug}`,
    title: `${service.label} | Mundoria`,
  });
}

export default function CleaningServicePage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  if (!service) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? service.bookingHref : "/setup";

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          description: service.description,
          name: service.label,
          provider: {
            "@type": "Organization",
            name: "Mundoria",
            url: absoluteUrl("/"),
          },
          url: absoluteUrl(`/cleaning/${service.slug}`),
        }}
      />
      <ServiceCategoryMarketingPage
        bookingHref={bookingHref}
        config={serviceDetailConfig(service)}
      />
    </MarketingShell>
  );
}
