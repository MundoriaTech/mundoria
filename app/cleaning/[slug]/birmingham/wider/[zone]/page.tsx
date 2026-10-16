import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  birminghamCoverageZoneById,
} from "@/lib/seo/birmingham-coverage";
import {
  MARKETING_SERVICES,
  marketingServiceBySlug,
  servicePlacePath,
  servicePlaceZonePath,
} from "@/lib/seo/marketing";
import { bookingHrefForFocus } from "@/lib/seo/place-page-focus";
import {
  serviceInnerPlaceLinks,
  serviceSurroundingTownLinks,
} from "@/lib/seo/service-place-links";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { slug: string; zone: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return MARKETING_SERVICES.flatMap((service) =>
    BIRMINGHAM_COVERAGE_ZONES.map((zone) => ({
      slug: service.slug,
      zone: zone.id,
    })),
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  const zone = birminghamCoverageZoneById(params.zone);
  if (!service || !zone) return {};
  const title = `${service.label} in ${zone.label}`;
  return buildPageMetadata({
    description: zone.note
      ? `${title}. ${zone.note} Book from ${service.fromPrice}.`
      : `${service.description} Book ${service.label.toLowerCase()} in ${zone.label} from ${service.fromPrice}.`,
    path: servicePlaceZonePath(service.slug, zone.id),
    title: `${title} | Mundoria`,
  });
}

export default function ServiceBirminghamZonePage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  const zone = birminghamCoverageZoneById(params.zone);
  if (!service || !zone) notFound();
  if (zone.id === "border") permanentRedirect(servicePlacePath(service.slug));
  const focus = {
    serviceLabel: service.label,
    serviceSlug: service.slug,
  };

  return (
    <CityLocationPage
      bookingHref={bookingHrefForFocus(hasSupabasePublicConfig(), focus)}
      focus={focus}
      name={zone.label}
      path={servicePlaceZonePath(service.slug, zone.id)}
      placeLinks={serviceInnerPlaceLinks(service.slug, zone.id)}
      placesNote={zone.note}
      serviceCardLocation={{ kind: "zone", id: zone.id }}
      surroundingLinks={serviceSurroundingTownLinks(service.slug, zone.id)}
    />
  );
}
