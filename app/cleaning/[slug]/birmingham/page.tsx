import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  LAUNCH_CITY,
  MARKETING_SERVICES,
  marketingServiceBySlug,
  servicePlacePath,
} from "@/lib/seo/marketing";
import { bookingHrefForFocus } from "@/lib/seo/place-page-focus";
import { serviceTownLinks } from "@/lib/seo/service-place-links";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return MARKETING_SERVICES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  if (!service) return {};
  const title = `${service.label} in ${LAUNCH_CITY.name}`;
  return buildPageMetadata({
    description: `${service.description} Book ${service.label.toLowerCase()} in ${LAUNCH_CITY.name} from ${service.fromPrice}.`,
    path: servicePlacePath(service.slug),
    title: `${title} | Mundoria`,
  });
}

export default function ServiceBirminghamPage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  if (!service) notFound();
  const focus = {
    serviceLabel: service.label,
    serviceSlug: service.slug,
  };

  return (
    <CityLocationPage
      bookingHref={bookingHrefForFocus(hasSupabasePublicConfig(), focus)}
      focus={focus}
      name={LAUNCH_CITY.name}
      path={servicePlacePath(service.slug)}
      placeLinks={serviceTownLinks(service.slug)}
      showNearbyTowns
      serviceCardLocation={{ kind: "city" }}
    />
  );
}
