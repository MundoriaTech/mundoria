import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
import { PostcodeDistrictPage } from "@/components/marketing/postcode-district-page";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  BIRMINGHAM_NEARBY_ZONE_ID,
  birminghamCompoundZones,
  birminghamCoveragePlaceBySlug,
  birminghamCoverageZoneByHubSlug,
  birminghamCoverageZoneById,
  coverageAreaHref,
  coverageAreaSlug,
  coverageFocusSearch,
  coverageZoneHref,
  coverageZoneHubSlug,
} from "@/lib/seo/birmingham-coverage";
import {
  cleanerPlacePath,
  isStandaloneTownSlug,
  SEO_AREA_REDIRECTS,
  canonicalAreaPath,
} from "@/lib/seo/canonical";
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

/** Legacy postcode areaSlug before Birmingham City Centre was unified. */
const LEGACY_CITY_CENTRE_SLUG = "city-centre";
const CITY_CENTRE_PLACE_SLUG = "birmingham-city-centre";

/** Districts without a neighbourhood hub redirect to a real place page, or the city hub. */
function redirectOrphanPostcodeDistrict(areaSlug: string): never {
  const resolved =
    areaSlug === LEGACY_CITY_CENTRE_SLUG ? CITY_CENTRE_PLACE_SLUG : areaSlug;
  if (
    birminghamAreaBySlug(resolved) ||
    birminghamCoveragePlaceBySlug(resolved)
  ) {
    permanentRedirect(cleanerPlacePath(resolved));
  }
  permanentRedirect(`/cleaners/${LAUNCH_CITY.slug}`);
}

/** Coverage places beyond the core neighbourhoods render on demand. */
export const dynamicParams = true;

export function generateStaticParams() {
  return [
    ...priorityBirminghamAreaSlugs().map((area) => ({ area })),
    ...birminghamCompoundZones().map((zone) => ({
      area: coverageZoneHubSlug(zone),
    })),
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
    const title = `House Cleaners in ${label}, Birmingham`;
    return buildPageMetadata({
      description: `Vetted house cleaners in ${label}, ${parsed.district.prefix} from £22/h. Regular, deep and end of tenancy cleans. Instant estimate, book online in minutes.`,
      path: postcodePath(parsed.district.prefix),
      title: `${title} | From £22/h – Mundoria`,
    });
  }
  if (params.area === LEGACY_CITY_CENTRE_SLUG) {
    permanentRedirect(cleanerPlacePath(CITY_CENTRE_PLACE_SLUG));
  }
  if (params.area in SEO_AREA_REDIRECTS) {
    permanentRedirect(canonicalAreaPath(params.area));
  }
  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  const zoneHub = birminghamCoverageZoneByHubSlug(params.area);
  const name = area?.name ?? coverage?.label ?? zoneHub?.label;
  if (!name) return {};
  const focus = readPlacePageFocus(searchParams ?? {});
  const title = cleaningPlaceTitle({
    category: focus.category,
    place: name,
    preposition: "in",
    serviceLabel: focus.serviceLabel,
  });
  const pathSlug =
    area?.slug ?? coverage?.slug ?? (zoneHub ? coverageZoneHubSlug(zoneHub) : null);
  if (!pathSlug) return {};
  return buildPageMetadata({
    description: `${title}. Vetted independent cleaners, from £22/h. Clear estimate before you book, live updates. Book online in minutes.`,
    path: cleanerPlacePath(pathSlug),
    title: `${title} | From £22/h – Mundoria`,
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

  if (params.area === LEGACY_CITY_CENTRE_SLUG) {
    const focus = readPlacePageFocus(searchParams ?? {});
    permanentRedirect(
      `${cleanerPlacePath(CITY_CENTRE_PLACE_SLUG)}${coverageFocusSearch(focus)}`,
    );
  }

  if (params.area in SEO_AREA_REDIRECTS) {
    const focus = readPlacePageFocus(searchParams ?? {});
    permanentRedirect(`${canonicalAreaPath(params.area)}${coverageFocusSearch(focus)}`);
  }

  const area = birminghamAreaBySlug(params.area);
  const coverage = birminghamCoveragePlaceBySlug(params.area);
  const zoneHub = birminghamCoverageZoneByHubSlug(params.area);
  if (!area && !coverage && !zoneHub) notFound();

  const focus = readPlacePageFocus(searchParams ?? {});
  const bookingHref = bookingHrefForFocus(hasSupabasePublicConfig(), focus);

  if (zoneHub && !area && !coverage) {
    const slug = coverageZoneHubSlug(zoneHub);
    return (
      <CityLocationPage
        bookingHref={bookingHref}
        focus={focus}
        name={zoneHub.label}
        path={`${cleanerPlacePath(slug)}${coverageFocusSearch(focus)}`}
        allAreasCovered={zoneHub.areas.map((item) => item.label)}
        placeLinks={zoneHub.areas.map((item) => ({
          href: coverageAreaHref(item, focus),
          label: item.label,
        }))}
        placesNote={zoneHub.note}
        regionLabel="Birmingham"
        surroundingLinks={BIRMINGHAM_COVERAGE_ZONES.filter(
          (item) =>
            item.id !== zoneHub.id && item.id !== BIRMINGHAM_NEARBY_ZONE_ID,
        ).map((item) => ({
          href: coverageZoneHref(item.id, focus),
          label: item.label,
        }))}
      />
    );
  }

  const name = area?.name ?? coverage!.label;
  const slug = area?.slug ?? coverage!.slug;
  const zone = coverage ? birminghamCoverageZoneById(coverage.zoneId) : null;

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
              (item) =>
                item.id !== zone.id && item.id !== BIRMINGHAM_NEARBY_ZONE_ID,
            ).map((item) => ({
              href: coverageZoneHref(item.id, focus),
              label: item.label,
            }))
          : undefined
      }
    />
  );
}
