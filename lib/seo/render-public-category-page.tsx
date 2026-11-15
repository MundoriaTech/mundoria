import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
} from "@/components/marketing/branded-page-sections";
import { CityLocationPage } from "@/components/marketing/city-location-page";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PlaceMapHero } from "@/components/marketing/place-map-hero";
import { ResidentialCleaningPage } from "@/components/marketing/residential/residential-cleaning-page";
import { CommercialCleaningPage } from "@/components/marketing/commercial/commercial-cleaning-page";
import { MovingHomeCleaningPage } from "@/components/marketing/moving-home/moving-home-cleaning-page";
import { ShortLetsCleaningPage } from "@/components/marketing/short-lets/short-lets-cleaning-page";
import { RecoveryCleaningPage } from "@/components/marketing/recovery/recovery-cleaning-page";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
import { loadPageDirectoryContent } from "@/lib/marketing/page-directory";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  BIRMINGHAM_NEARBY_ZONE_ID,
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
  SEO_AREA_REDIRECTS,
  isStandaloneTownSlug,
} from "@/lib/seo/canonical";
import {
  categoryCityPath,
  categoryPlacePath,
  categoryRootPath,
  parseCategorySegments,
  serviceCityPath,
  servicePlacePath,
  servicePublicPath,
  type PublicPathParse,
} from "@/lib/seo/public-paths";
import {
  LAUNCH_CITY,
  birminghamAreaBySlug,
  districtFromAreaParam,
  getMarketingServices,
} from "@/lib/seo/marketing";
import { nearestCoverageAreas } from "@/lib/seo/nearby-places";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import {
  bookingHrefForFocus,
  cleaningPlaceTitle,
  type PlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { serviceDetailConfig } from "@/lib/seo/service-detail-config";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import {
  birminghamAreasServed,
  organizationRef,
  serviceSchema,
} from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import type { ServiceCategory, ServiceType } from "@/types/customer";

type Cat = Exclude<ServiceCategory, "exterior">;

const LEGACY_CITY_CENTRE_SLUG = "city-centre";
const CITY_CENTRE_PLACE_SLUG = "birmingham-city-centre";

const ONPAGE_PATH: Record<Cat, string> = {
  residential: "/house-cleaning",
  commercial: "/workspace-cleaning",
  moving_home: "/moving-cleaning",
  short_term_rental: "/airbnb-cleaning",
  recovery: "/recovery-cleaning",
};

function redirectPostcodeDistrict(areaSlug: string, category: Cat): never {
  const resolved =
    areaSlug === LEGACY_CITY_CENTRE_SLUG ? CITY_CENTRE_PLACE_SLUG : areaSlug;
  if (
    birminghamAreaBySlug(resolved) ||
    birminghamCoveragePlaceBySlug(resolved)
  ) {
    permanentRedirect(categoryPlacePath(category, resolved));
  }
  permanentRedirect(categoryCityPath(category));
}

export async function publicCategoryMetadata(
  category: Cat,
  segments: string[],
): Promise<Metadata> {
  const parsed = parseCategorySegments(category, segments);
  if (!parsed) return {};

  const from = houseCleaningFromLabel(await loadServicePricing());

  if (!parsed.placeSlug && !parsed.citySlug && !parsed.serviceType) {
    const copy = onpageCopyForPath(ONPAGE_PATH[category]);
    return buildPageMetadata({
      description: copy?.description ?? LAUNCH_CITY.seoDescription,
      path: categoryRootPath(category),
      title: copy?.title ?? categoryRootPath(category).slice(1),
    });
  }

  if (parsed.serviceType && !parsed.citySlug) {
    const services = await getMarketingServices();
    const service = services.find((item) => item.value === parsed.serviceType);
    if (!service) return {};
    return buildPageMetadata({
      description: service.seoDescription,
      path: servicePublicPath(category, parsed.serviceType),
      title: service.seoTitle ?? `${service.label} | Mundoria`,
    });
  }

  if (
    parsed.citySlug === LAUNCH_CITY.slug &&
    (!parsed.placeSlug || parsed.placeSlug === LAUNCH_CITY.slug) &&
    !parsed.serviceType
  ) {
    // House cleaning city hub is the category root.
    if (category === "residential") {
      permanentRedirect(categoryRootPath("residential"));
    }
    const title =
      category === "commercial"
        ? "Workspace cleaning in Birmingham"
        : category === "moving_home"
          ? "Moving home cleaning in Birmingham"
          : category === "short_term_rental"
            ? "Airbnb cleaning in Birmingham"
            : "Recovery cleaning in Birmingham";
    return buildPageMetadata({
      description: `${title}. Vetted independent cleaners, house cleaning from ${from}. See the price before you book.`,
      path: categoryCityPath(category),
      title: `${title} | Mundoria`,
    });
  }

  if (
    parsed.serviceType &&
    parsed.citySlug === LAUNCH_CITY.slug &&
    !parsed.placeSlug
  ) {
    const services = await getMarketingServices();
    const service = services.find((item) => item.value === parsed.serviceType);
    if (!service) return {};
    return buildPageMetadata({
      description: `${service.label} in Birmingham. Vetted independent cleaners from ${from}.`,
      path: serviceCityPath(category, parsed.serviceType),
      title: `${service.label} in Birmingham | Mundoria`,
    });
  }

  const placeSlug = parsed.placeSlug;
  if (!placeSlug) return {};

  const district = districtFromAreaParam(placeSlug);
  if (district) {
    redirectPostcodeDistrict(district.district.areaSlug, category);
  }
  if (placeSlug === LEGACY_CITY_CENTRE_SLUG) {
    permanentRedirect(categoryPlacePath(category, CITY_CENTRE_PLACE_SLUG));
  }
  if (placeSlug in SEO_AREA_REDIRECTS) {
    permanentRedirect(
      categoryPlacePath(category, SEO_AREA_REDIRECTS[placeSlug]!),
    );
  }

  const area = birminghamAreaBySlug(placeSlug);
  const coverage = birminghamCoveragePlaceBySlug(placeSlug);
  const zoneHub = birminghamCoverageZoneByHubSlug(placeSlug);
  const name =
    area?.name ??
    coverage?.label ??
    zoneHub?.label ??
    (isStandaloneTownSlug(placeSlug)
      ? placeSlug
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : null);
  if (!name) return {};

  const services = await getMarketingServices();
  const service = parsed.serviceType
    ? services.find((item) => item.value === parsed.serviceType)
    : null;
  const title = cleaningPlaceTitle({
    category: service ? undefined : category,
    place: name,
    preposition: "in",
    serviceLabel: service?.label,
  });
  const path = parsed.serviceType
    ? servicePlacePath(category, parsed.serviceType, placeSlug)
    : categoryPlacePath(category, placeSlug);

  return buildPageMetadata({
    description: `${title}. Vetted independent cleaners, house cleaning from ${from}. See the price before you book and follow your cleaner live.`,
    path,
    title: service ? title : `${title} from ${from}`,
  });
}

export async function renderPublicCategoryPage(
  category: Cat,
  segments: string[],
) {
  const parsed = parseCategorySegments(category, segments);
  if (!parsed) notFound();

  const configured = hasSupabasePublicConfig();

  if (!parsed.serviceType && !parsed.citySlug && !parsed.placeSlug) {
    return renderCategoryHub(category, configured);
  }

  if (parsed.serviceType && !parsed.citySlug) {
    return renderServiceHub(category, parsed.serviceType, configured);
  }

  if (
    parsed.citySlug === LAUNCH_CITY.slug &&
    (!parsed.placeSlug || parsed.placeSlug === LAUNCH_CITY.slug) &&
    !parsed.serviceType
  ) {
    if (category === "residential") {
      permanentRedirect(categoryRootPath("residential"));
    }
    return renderCityHub(category, configured);
  }

  if (
    parsed.serviceType &&
    parsed.citySlug === LAUNCH_CITY.slug &&
    !parsed.placeSlug
  ) {
    return renderCityHub(category, configured, parsed.serviceType);
  }

  const placeSlug = parsed.placeSlug;
  if (!placeSlug) notFound();

  const district = districtFromAreaParam(placeSlug);
  if (district) {
    redirectPostcodeDistrict(district.district.areaSlug, category);
  }
  if (placeSlug === LEGACY_CITY_CENTRE_SLUG) {
    permanentRedirect(
      parsed.serviceType
        ? servicePlacePath(category, parsed.serviceType, CITY_CENTRE_PLACE_SLUG)
        : categoryPlacePath(category, CITY_CENTRE_PLACE_SLUG),
    );
  }
  if (placeSlug in SEO_AREA_REDIRECTS) {
    const target = SEO_AREA_REDIRECTS[placeSlug]!;
    permanentRedirect(
      parsed.serviceType
        ? servicePlacePath(category, parsed.serviceType, target)
        : categoryPlacePath(category, target),
    );
  }

  return renderPlacePage(category, parsed, configured);
}

async function renderCategoryHub(category: Cat, configured: boolean) {
  const path = categoryRootPath(category);
  const bookingHref = configured
    ? `/booking/new?category=${category}&returnTo=${encodeURIComponent(path)}`
    : "/setup";
  const fromRateLabel = houseCleaningFromLabel(await loadServicePricing());
  const { cleaners, reviews } = await loadPageDirectoryContent({ category });

  if (category === "residential") {
    return (
      <MarketingShell>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Service",
              areaServed: { "@type": "City", name: "Birmingham" },
              description:
                "House cleaning for everyday homes, deep resets and flexible one-off visits.",
              name: "House Cleaning",
              provider: organizationRef(),
              url: absoluteUrl(path),
            },
            await launchCityFaqJsonLd(),
          ]}
        />
        <ResidentialCleaningPage
          bookingHref={bookingHref}
          cleaners={cleaners}
          fromRateLabel={fromRateLabel}
          reviews={reviews}
        />
        <BrandedPageWash>
          <LaunchCityHubSections
            bookingHref={bookingHref}
            categoryFocus="residential"
            cleanerLimit={18}
            placePath={path}
            showAreaCards
          />
          <BrandedCtaBand
            body="Enter your Birmingham postcode and service, we’ll show a clear estimate before you book."
            href={bookingHref}
            label="Book house cleaning"
            title="Ready to book in Birmingham?"
          />
        </BrandedPageWash>
      </MarketingShell>
    );
  }

  if (category === "commercial") {
    return (
      <MarketingShell>
        <CommercialCleaningPage
          bookingHref={bookingHref}
          cleaners={cleaners}
          reviews={reviews}
        />
      </MarketingShell>
    );
  }

  if (category === "moving_home") {
    return (
      <MarketingShell>
        <MovingHomeCleaningPage
          bookingHref={bookingHref}
          cleaners={cleaners}
          reviews={reviews}
        />
      </MarketingShell>
    );
  }

  if (category === "short_term_rental") {
    return (
      <MarketingShell>
        <ShortLetsCleaningPage
          bookingHref={bookingHref}
          cleaners={cleaners}
          reviews={reviews}
        />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <RecoveryCleaningPage
        bookingHref={bookingHref}
        cleaners={cleaners}
        reviews={reviews}
      />
    </MarketingShell>
  );
}

async function renderServiceHub(
  category: Cat,
  serviceType: ServiceType,
  configured: boolean,
) {
  const priced = await getMarketingServices();
  const service = priced.find((item) => item.value === serviceType);
  if (!service) notFound();

  const path = servicePublicPath(category, serviceType);
  const bookingHref = configured
    ? `${service.bookingHref}${service.bookingHref.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(path)}`
    : "/setup";
  const { cleaners, reviews } = await loadPageDirectoryContent({
    serviceType: service.value,
  });

  return (
    <MarketingShell>
      <JsonLd
        data={serviceSchema(service, { description: service.description })}
      />
      <ServiceCategoryMarketingPage
        bookingHref={bookingHref}
        cleaners={cleaners}
        config={serviceDetailConfig(service, priced)}
        reviews={reviews}
      />
    </MarketingShell>
  );
}

async function renderCityHub(
  category: Cat,
  configured: boolean,
  serviceType?: ServiceType,
) {
  const path = serviceType
    ? serviceCityPath(category, serviceType)
    : categoryCityPath(category);
  const bookingHref = configured
    ? serviceType
      ? `/booking/new?service=${serviceType}&returnTo=${encodeURIComponent(path)}`
      : `/booking/new?category=${category}&returnTo=${encodeURIComponent(path)}`
    : "/setup";

  const service = serviceType
    ? (await getMarketingServices()).find((item) => item.value === serviceType)
    : null;

  const heroTitle = service
    ? `${service.label} in Birmingham`
    : category === "residential"
      ? "House cleaning in Birmingham"
      : category === "commercial"
        ? "Workspace cleaning in Birmingham"
        : category === "moving_home"
          ? "Moving home cleaning in Birmingham"
          : category === "short_term_rental"
            ? "Airbnb cleaning in Birmingham"
            : "Recovery cleaning in Birmingham";

  const hubCategory =
    category === "residential" ||
    category === "commercial" ||
    category === "moving_home" ||
    category === "recovery" ||
    category === "short_term_rental"
      ? category
      : "residential";

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: birminghamAreasServed(),
            description: LAUNCH_CITY.seoDescription,
            name: heroTitle,
            provider: organizationRef(),
            serviceType: heroTitle,
            url: absoluteUrl(path),
          },
        ]}
      />
      <PlaceMapHero
        bullets={[
          "One-off or regular house cleaning",
          "Clear estimates before you book",
          "Reliable, vetted cleaners you can trust",
        ]}
        description="One-off or regular house cleaning with tried & vetted cleaners in your area, clear estimates from booking to checklist."
        primaryHref={bookingHref}
        primaryLabel="Book in Birmingham"
        showReviews
        title={heroTitle}
      />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus={hubCategory}
          cleanerLimit={18}
          placePath={path}
          serviceFocus={service ?? undefined}
          showAreaCards={category === "residential" && !service}
        />
        <BrandedCtaBand
          body="Enter your Birmingham postcode and service, we’ll show a clear estimate before you book."
          href={bookingHref}
          label="Book in Birmingham"
          title="Ready to book in Birmingham?"
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}

async function renderPlacePage(
  category: Cat,
  parsed: PublicPathParse,
  configured: boolean,
) {
  const placeSlug = parsed.placeSlug!;
  const area = birminghamAreaBySlug(placeSlug);
  const coverage = birminghamCoveragePlaceBySlug(placeSlug);
  const zoneHub = birminghamCoverageZoneByHubSlug(placeSlug);
  if (!area && !coverage && !zoneHub && !isStandaloneTownSlug(placeSlug)) {
    notFound();
  }

  const services = await getMarketingServices();
  const service = parsed.serviceType
    ? services.find((item) => item.value === parsed.serviceType)
    : null;

  const focus: PlacePageFocus = service
    ? { serviceLabel: service.label, serviceSlug: service.slug }
    : { category };

  const path =
    (parsed.serviceType
      ? servicePlacePath(category, parsed.serviceType, placeSlug)
      : categoryPlacePath(category, placeSlug)) + coverageFocusSearch(focus);

  const bookingHref = bookingHrefForFocus(configured, focus);

  if (zoneHub && !area && !coverage) {
    const slug = coverageZoneHubSlug(zoneHub);
    return (
      <CityLocationPage
        allAreasCovered={zoneHub.areas.map((item) => item.label)}
        bookingHref={bookingHref}
        focus={focus}
        name={zoneHub.label}
        path={
          (parsed.serviceType
            ? servicePlacePath(category, parsed.serviceType, slug)
            : categoryPlacePath(category, slug)) + coverageFocusSearch(focus)
        }
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

  if (isStandaloneTownSlug(placeSlug) && !area && !coverage) {
    return (
      <CityLocationPage
        bookingHref={bookingHref}
        focus={focus}
        name={placeSlug
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")}
        path={path}
        regionLabel={null}
        showNearbyTowns
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
      path={path}
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
