import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  CategoryMagLinks,
  magCategoryFor,
} from "@/components/marketing/category-mag-links";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ServiceCityCoverage } from "@/components/marketing/service-city-coverage";
import { ServiceGuideLinks } from "@/components/marketing/service-guide-links";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import {
  canonicalCleaningPath,
  isIndexableServiceSlug,
} from "@/lib/seo/canonical";
import {
  getMarketingServiceBySlug,
  getMarketingServices,
  indexableMarketingServices,
  marketingServiceBySlug,
} from "@/lib/seo/marketing";
import { serviceDetailConfig } from "@/lib/seo/service-detail-config";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { serviceSchema } from "@/lib/seo/structured-data";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return indexableMarketingServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isIndexableServiceSlug(params.slug)) return {};
  const service = await getMarketingServiceBySlug(params.slug);
  if (!service) return {};
  return buildPageMetadata({
    description: service.seoDescription,
    path: `/cleaning/${service.slug}`,
    title: service.seoTitle ?? `${service.label} | Mundoria`,
  });
}

export default async function CleaningServicePage({ params }: PageProps) {
  if (!isIndexableServiceSlug(params.slug)) {
    permanentRedirect(canonicalCleaningPath(params.slug));
  }

  const priced = await getMarketingServices();
  const service = marketingServiceBySlug(params.slug, priced);
  if (!service) notFound();

  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? service.bookingHref : "/setup";
  const magCategory = magCategoryFor(service.category);

  return (
    <MarketingShell>
      <JsonLd
        data={serviceSchema(service, { description: service.description })}
      />
      <ServiceCategoryMarketingPage
        bookingHref={bookingHref}
        config={serviceDetailConfig(service, priced)}
      />
      <ServiceGuideLinks service={service} />
      <ServiceCityCoverage service={service} />
      {magCategory ? (
        <CategoryMagLinks category={magCategory} serviceSlug={service.slug} />
      ) : null}
    </MarketingShell>
  );
}
