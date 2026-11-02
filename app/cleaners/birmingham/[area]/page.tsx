import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import { PostcodeDistrictPage } from "@/components/marketing/postcode-district-page";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  birminghamCoveragePlaceBySlug,
  birminghamCoverageZoneById,
  coverageAreaHref,
  coverageAreaSlug,
  coverageFocusSearch,
  coverageZoneHref,
} from "@/lib/seo/birmingham-coverage";
import { cleanerPlacePath, isStandaloneTownSlug } from "@/lib/seo/canonical";
import {
  LAUNCH_CITY,
  birminghamAreaBySlug,
  districtFromAreaParam,
  districtLinkLabel,
  indexableBirminghamPostcodes,
  isIndexablePostcodeDistrict,
  postcodePath,
} from "@/lib/seo/marketing";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  readPlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { buildPageMetadata } from "@/lib/seo/site";
import { priorityBirminghamAreaSlugs } from "@/lib/seo/static-params";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { area: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

/** Districts without a neighbourhood hub redirect to a real place page, or the city hub. */
function redirectOrphanPostcodeDistrict(areaSlug: string): never {
  if (birminghamAreaBySlug(areaSlug) || birminghamCoveragePlaceBySlug(areaSlug)) {
    permanentRedirect(cleanerPlacePath(areaSlug));
  }
  permanentRedirect(`/cleaners/${LAUNCH_CITY.slug}`);
}

/** Coverage places beyond the core neighbourhoods render on demand. */
export const dynamicParams = true;

export function generateStaticParams() {
  return [
    ...priorityBirminghamAreaSlugs().map((area) => ({ area })),
    ...indexableBirminghamPostcodes().map((item) => ({
      area: `${item.areaSlug}-${item.prefix.toLowerCase()}`,
    })),
  ];
}

export function generateMetadata({ params, searchParams }: PageProps): Metadata {
  const parsed = districtFromAreaParam(params.area);
  if (parsed) {
    // Orphan district URLs (no neighbourhood hub) must not stay as soft-404 pages.
    if (!isIndexablePostcodeDistrict(parsed.district.prefix)) {
      redirectOrphanPostcodeDistrict(parsed.district.areaSlug);
    }
    if (parsed.legacy) permanentRedirect(postcodePath(parsed.district.prefix));
    const label = districtLinkLabel(parsed.district.prefix);
    return buildPageMetadata({
      description: `Cleaners in ${label}, Birmingham. Book with a clear estimate before you pay.`,
      path: postcodePath(parsed.district.prefix),
      title: `Cleaners in ${label}, Birmingham`,
    });
  }
  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  const name = area?.name ?? coverage?.label;
  if (!name) return {};
  const focus = readPlacePageFocus(searchParams ?? {});
  const title = cleaningPlaceTitle({
    category: focus.category,
    place: name,
    preposition: "in",
    serviceLabel: focus.serviceLabel,
  });
  return buildPageMetadata({
    description: coverage?.note
      ? `${title} (${coverage.note}). Book with a clear estimate before you pay.`
      : `${title}. Book with a clear estimate before you pay.`,
    path: cleanerPlacePath(area?.slug ?? coverage!.slug),
    title: `${title} | Mundoria`,
  });
}

export default async function BirminghamAreaPage({
  params,
  searchParams,
}: PageProps) {
  const parsed = districtFromAreaParam(params.area);
  if (parsed) {
    if (!isIndexablePostcodeDistrict(parsed.district.prefix)) {
      redirectOrphanPostcodeDistrict(parsed.district.areaSlug);
    }
    if (parsed.legacy) permanentRedirect(postcodePath(parsed.district.prefix));
    return <PostcodeDistrictPage prefix={parsed.district.prefix} />;
  }

  if (isStandaloneTownSlug(params.area)) {
    const focus = readPlacePageFocus(searchParams ?? {});
    permanentRedirect(
      `${cleanerPlacePath(params.area)}${coverageFocusSearch(focus)}`,
    );
  }

  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  if (!area && !coverage) notFound();

  const name = area?.name ?? coverage!.label;
  const slug = area?.slug ?? coverage!.slug;
  const zone = coverage ? birminghamCoverageZoneById(coverage.zoneId) : null;
  const focus = readPlacePageFocus(searchParams ?? {});
  const bookingHref = bookingHrefForFocus(hasSupabasePublicConfig(), focus);

  return (
    <CityLocationPage
      bookingHref={bookingHref}
      focus={focus}
      name={name}
      path={`${cleanerPlacePath(slug)}${coverageFocusSearch(focus)}`}
      placeLinks={
        zone
          ? zone.areas
              .filter((item) => coverageAreaSlug(item) !== slug)
              .map((item) => ({
                href: coverageAreaHref(item, focus),
                label: item.label,
              }))
          : undefined
      }
      placesNote={coverage?.note ?? zone?.note}
      regionLabel="Birmingham"
      surroundingLinks={
        zone
          ? BIRMINGHAM_COVERAGE_ZONES.filter(
              (item) => item.id !== zone.id && item.id !== "border",
            ).map((item) => ({
              href: coverageZoneHref(item.id, focus),
              label: item.label,
            }))
          : undefined
      }
    />
  );
}
