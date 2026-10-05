import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServicePlacePage } from "@/components/marketing/service-place-page";
import {
  BIRMINGHAM_AREAS,
  MARKETING_SERVICES,
  birminghamAreaBySlug,
  marketingServiceBySlug,
  servicePlacePath,
} from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";

type PageProps = {
  params: { area: string; slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return MARKETING_SERVICES.flatMap((service) =>
    BIRMINGHAM_AREAS.map((area) => ({
      area: area.slug,
      slug: service.slug,
    })),
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  const area = birminghamAreaBySlug(params.area);
  if (!service || !area) return {};
  return buildPageMetadata({
    description: `${service.description} Book ${service.label.toLowerCase()} in ${area.name}, Birmingham from ${service.fromPrice}.`,
    path: servicePlacePath(service.slug, area.slug),
    title: `${service.label} in ${area.name}, Birmingham`,
  });
}

export default function ServiceBirminghamAreaPage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  const area = birminghamAreaBySlug(params.area);
  if (!service || !area) notFound();
  return <ServicePlacePage area={area} service={service} />;
}
