import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  birminghamCoveragePlaceBySlug,
  birminghamCoverageZoneById,
} from "@/lib/seo/birmingham-coverage";
import {
  birminghamAreaBySlug,
  marketingServiceBySlug,
  servicePlacePath,
} from "@/lib/seo/marketing";
import { bookingHrefForFocus } from "@/lib/seo/place-page-focus";
import {
  serviceInnerPlaceLinks,
  serviceSurroundingTownLinks,
} from "@/lib/seo/service-place-links";
import { buildPageMetadata } from "@/lib/seo/site";
import { priorityServiceAreaStaticParams } from "@/lib/seo/static-params";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { area: string; slug: string };
};

/** Deep coverage places stay linked from the sitemap and render on first request. */
export const dynamicParams = true;

export function generateStaticParams() {
  return priorityServiceAreaStaticParams();
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  const name = area?.name ?? coverage?.label;
  if (!service || !name) return {};
  const title = `${service.label} in ${name}`;
  return buildPageMetadata({
    description: coverage?.note
      ? `${title} (${coverage.note}). Book from ${service.fromPrice}.`
      : `${service.description} Book ${service.label.toLowerCase()} in ${name}, Birmingham from ${service.fromPrice}.`,
    path: servicePlacePath(service.slug, area?.slug ?? coverage!.slug),
    title: `${title} | Mundoria`,
  });
}

export default function ServiceBirminghamAreaPage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  if (!service || (!area && !coverage)) notFound();

  const name = area?.name ?? coverage!.label;
  const slug = area?.slug ?? coverage!.slug;
  const zone = coverage ? birminghamCoverageZoneById(coverage.zoneId) : null;
  const focus = {
    serviceLabel: service.label,
    serviceSlug: service.slug,
  };

  return (
    <CityLocationPage
      bookingHref={bookingHrefForFocus(hasSupabasePublicConfig(), focus)}
      focus={focus}
      name={name}
      path={servicePlacePath(service.slug, slug)}
      placeLinks={
        zone ? serviceInnerPlaceLinks(service.slug, zone.id, slug) : undefined
      }
      placesNote={coverage?.note ?? zone?.note}
      serviceCardLocation={{ kind: "place", slug }}
      surroundingLinks={
        zone ? serviceSurroundingTownLinks(service.slug, zone.id) : undefined
      }
    />
  );
}
