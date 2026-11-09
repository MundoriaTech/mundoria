import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CityLocationPage } from "@/components/marketing/city-location-page";
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
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
import {
  LAUNCH_CITY,
  birminghamAreaBySlug,
  districtFromAreaParam,
} from "@/lib/seo/marketing";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  readPlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { nearestCoverageAreas } from "@/lib/seo/nearby-places";
import { buildPageMetadata } from "@/lib/seo/site";
import { priorityBirminghamAreaSlugs } from "@/lib/seo/static-params";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

type PageProps = {
  params: { area: string };
  searchParams?: { category?: string | string[]; service?: string | string[] };
};

/** Legacy postcode areaSlug before Birmingham City Centre was unified. */
const LEGACY_CITY_CENTRE_SLUG = "city-centre";
const CITY_CENTRE_PLACE_SLUG = "birmingham-city-centre";

/**
 * Postcode-district URLs (`harborne-b17`, bare `b17`) were thin, unlinked
 * copies of their neighbourhood page, and districts sharing a neighbourhood
 * had identical text (B1/B3, B15/B16). They all now redirect, in one hop, to
 * the neighbourhood's final page, or the city hub when there is none.
 */
function redirectPostcodeDistrict(areaSlug: string): never {
  const resolved =
    areaSlug === LEGACY_CITY_CENTRE_SLUG ? CITY_CENTRE_PLACE_SLUG : areaSlug;
  if (
    birminghamAreaBySlug(resolved) ||
    birminghamCoveragePlaceBySlug(resolved)
  ) {
    permanentRedirect(canonicalAreaPath(resolved));
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
  ];
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const parsed = districtFromAreaParam(params.area);
  if (parsed) redirectPostcodeDistrict(parsed.district.areaSlug);
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
  // Live admin rate card, so the title matches the cards and the booking flow.
  const from = houseCleaningFromLabel(await loadServicePricing());
  return buildPageMetadata({
    description: `${title}. Vetted independent cleaners, house cleaning from ${from}. See the price before you book and follow your cleaner live.`,
    path: cleanerPlacePath(pathSlug),
    // The house-cleaning rate only belongs in the plain (unfocused) title.
    title:
      focus.category || focus.serviceLabel ? title : `${title} from ${from}`,
  });
}

export default async function BirminghamAreaPage({
  params,
  searchParams,
}: PageProps) {
  const parsed = districtFromAreaParam(params.area);
  if (parsed) redirectPostcodeDistrict(parsed.district.areaSlug);

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
          ? (zone.id === BIRMINGHAM_NEARBY_ZONE_ID
              ? nearestCoverageAreas(name, zone.areas)
              : zone.areas
            )
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
