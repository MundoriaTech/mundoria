import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServicePlacePage } from "@/components/marketing/service-place-page";
import {
  isPublicMarketingService,
  marketingServiceBySlug,
  publicMarketingServices,
  servicePlacePath,
} from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";

type PageProps = {
  params: { slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicMarketingServices().map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  if (!service || !isPublicMarketingService(service)) return {};
  return buildPageMetadata({
    description: `${service.description} Book ${service.label.toLowerCase()} in Birmingham from ${service.fromPrice}.`,
    path: servicePlacePath(service.slug),
    title: `${service.label} in Birmingham`,
  });
}

export default function ServiceBirminghamPage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  if (!service || !isPublicMarketingService(service)) notFound();
  return <ServicePlacePage area={null} service={service} />;
}
