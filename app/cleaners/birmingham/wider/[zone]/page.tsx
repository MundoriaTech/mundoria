import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  BIRMINGHAM_NEARBY_ZONE_ID,
  birminghamCompoundZoneIds,
  birminghamCoverageZoneById,
  coverageAreaHref,
  coverageFocusSearch,
  coverageZoneHref,
  coverageZonePath,
} from "@/lib/seo/birmingham-coverage";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  readPlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { zone: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

export function generateStaticParams() {
  return birminghamCompoundZoneIds().map((zone) => ({ zone }));
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  const zone = birminghamCoverageZoneById(params.zone);
  if (!zone || zone.id === BIRMINGHAM_NEARBY_ZONE_ID) return {};
  if (!birminghamCompoundZoneIds().includes(zone.id)) return {};

  const focus = readPlacePageFocus(searchParams ?? {});
  const title = cleaningPlaceTitle({
    category: focus.category,
    place: zone.label,
    preposition: "in",
    serviceLabel: focus.serviceLabel,
  });
  return buildPageMetadata({
    description: `${title}. Book with a clear estimate before you pay.`,
    path: coverageZonePath(zone.id),
    title: `${title} | Mundoria`,
  });
}

/** Compound coverage zones (e.g. Edgbaston & Harborne) get a real hub page. */
export default function BirminghamWiderZonePage({
  params,
  searchParams,
}: PageProps) {
  const zone = birminghamCoverageZoneById(params.zone);
  if (!zone || zone.id === BIRMINGHAM_NEARBY_ZONE_ID) notFound();
  if (!birminghamCompoundZoneIds().includes(zone.id)) notFound();

  const focus = readPlacePageFocus(searchParams ?? {});
  const bookingHref = bookingHrefForFocus(hasSupabasePublicConfig(), focus);
  const path = `${coverageZonePath(zone.id)}${coverageFocusSearch(focus)}`;

  return (
    <CityLocationPage
      bookingHref={bookingHref}
      focus={focus}
      name={zone.label}
      path={path}
      placeLinks={zone.areas.map((item) => ({
        href: coverageAreaHref(item, focus),
        label: item.label,
      }))}
      placesNote={zone.note}
      regionLabel="Birmingham"
      surroundingLinks={BIRMINGHAM_COVERAGE_ZONES.filter(
        (item) => item.id !== zone.id && item.id !== BIRMINGHAM_NEARBY_ZONE_ID,
      ).map((item) => ({
        href: coverageZoneHref(item.id, focus),
        label: item.label,
      }))}
    />
  );
}
