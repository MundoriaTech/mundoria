import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  birminghamCoveragePlaceBySlug,
  birminghamCoverageZoneById,
  coverageAreaHref,
  coverageAreaSlug,
  coverageFocusSearch,
} from "@/lib/seo/birmingham-coverage";
import {
  STANDALONE_TOWN_SLUGS,
  cleanerPlacePath,
  isStandaloneTownSlug,
} from "@/lib/seo/canonical";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  readPlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { area: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

/** Nearby towns get their own URL — not nested under /birmingham/. */
export function generateStaticParams() {
  return Array.from(STANDALONE_TOWN_SLUGS).map((area) => ({ area }));
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  if (!isStandaloneTownSlug(params.area)) return {};
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  if (!coverage) return {};
  const focus = readPlacePageFocus(searchParams ?? {});
  const title = cleaningPlaceTitle({
    category: focus.category,
    place: coverage.label,
    preposition: "in",
    serviceLabel: focus.serviceLabel,
  });
  return buildPageMetadata({
    description: coverage.note
      ? `${title} (${coverage.note}). Book with a clear estimate before you pay.`
      : `${title}. Book with a clear estimate before you pay.`,
    path: cleanerPlacePath(coverage.slug),
    title: `${title} | Mundoria`,
  });
}

export default function StandaloneTownCleanersPage({
  params,
  searchParams,
}: PageProps) {
  if (!isStandaloneTownSlug(params.area)) notFound();

  const coverage = birminghamCoveragePlaceBySlug(params.area);
  if (!coverage) notFound();

  const focus = readPlacePageFocus(searchParams ?? {});
  const zone = birminghamCoverageZoneById(coverage.zoneId);
  const bookingHref = bookingHrefForFocus(hasSupabasePublicConfig(), focus);

  return (
    <CityLocationPage
      bookingHref={bookingHref}
      focus={focus}
      name={coverage.label}
      path={`${cleanerPlacePath(coverage.slug)}${coverageFocusSearch(focus)}`}
      placeLinks={
        zone
          ? zone.areas
              .filter((item) => coverageAreaSlug(item) !== coverage.slug)
              .map((item) => ({
                href: coverageAreaHref(item, focus),
                label: item.label,
              }))
          : undefined
      }
      placesNote={coverage.note ?? zone?.note}
      regionLabel={null}
      serviceCardLocation={{ kind: "place", slug: coverage.slug }}
    />
  );
}
