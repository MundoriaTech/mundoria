import { JsonLd } from "@/components/marketing/json-ld";
import { BrandedPageWash } from "@/components/marketing/branded-page-sections";
import {
  LaunchCityHubSections,
  launchCityFaqJsonLd,
} from "@/components/marketing/launch-city-hub-sections";
import { placePhotoHero } from "@/components/marketing/service-category/category-photo-hero";
import { PlaceFeatureBand } from "@/components/marketing/service-category/place-feature-band";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PlaceMapHero } from "@/components/marketing/place-map-hero";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import {
  birminghamAreaBySlug,
  getMarketingServices,
  LAUNCH_CITY,
  marketingServiceBySlug,
  type MarketingArea,
} from "@/lib/seo/marketing";
import {
  cleaningPlaceTitle,
  type PlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { absoluteUrl } from "@/lib/seo/site";
import { organizationRef } from "@/lib/seo/structured-data";

const HERO_DESCRIPTION =
  "One-off or regular house cleaning with tried & vetted cleaners in your area, clear estimates from booking to checklist.";

function heroEyebrow(name: string, focus?: PlacePageFocus) {
  const lead = focus?.serviceLabel
    ? focus.serviceLabel
    : focus?.category === "commercial"
      ? "Workspace"
      : focus?.category === "recovery"
        ? "Recovery"
        : focus?.category === "residential"
          ? "House"
          : null;
  return lead
    ? `${lead} · ${name} · From clear online estimates`
    : `${name} · From clear online estimates`;
}

function placeSlugFromPath(path: string) {
  const bare = path.split("?")[0] || path;
  const parts = bare.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export async function CityLocationPage({
  bookingHref,
  focus,
  name,
  path,
  placeLinks,
  allAreasCovered,
  placesNote,
  regionLabel = "Birmingham",
  showNearbyTowns = false,
  surroundingLinks,
}: {
  bookingHref: string;
  focus?: PlacePageFocus;
  name: string;
  path: string;
  placeLinks?: Array<{ href: string; label: string }>;
  allAreasCovered?: string[];
  placesNote?: string;
  /** Local authority / city for schema, omit Birmingham for Solihull, Sandwell towns, etc. */
  regionLabel?: string | null;
  showNearbyTowns?: boolean;
  surroundingLinks?: Array<{ href: string; label: string }>;
}) {
  const [pricing, pricedServices] = await Promise.all([
    loadServicePricing(),
    getMarketingServices(),
  ]);
  const barePath = path.split("?")[0] || path;
  const placeSlug = placeSlugFromPath(barePath);
  const priorityArea: MarketingArea | null = birminghamAreaBySlug(placeSlug);
  const service = focus?.serviceSlug
    ? marketingServiceBySlug(focus.serviceSlug, pricedServices)
    : null;
  const categoryFocus =
    focus?.category ??
    (service?.category === "commercial" ||
    service?.category === "residential" ||
    service?.category === "recovery" ||
    service?.category === "moving_home" ||
    service?.category === "short_term_rental"
      ? service.category
      : undefined);
  const title = cleaningPlaceTitle({
    category: focus?.category,
    place: name,
    preposition: "in",
    serviceLabel: focus?.serviceLabel,
  });

  const photo = placePhotoHero(name, focus, pricing, pricedServices);
  const isStandaloneTown = regionLabel === null;
  const breadcrumbParent = isStandaloneTown
    ? {
        item: absoluteUrl("/cleaners"),
        name: "Cleaners",
      }
    : {
        item: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
        name: "Cleaners in Birmingham",
      };

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                item: absoluteUrl("/"),
                name: "Home",
                position: 1,
              },
              {
                "@type": "ListItem",
                item: breadcrumbParent.item,
                name: breadcrumbParent.name,
                position: 2,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(barePath),
                name: title,
                position: 3,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: {
              "@type": "Place",
              name: regionLabel ? `${name}, ${regionLabel}` : name,
            },
            description: priorityArea?.seoIntro ?? HERO_DESCRIPTION,
            name: title,
            provider: organizationRef(),
            url: absoluteUrl(barePath),
          },
          ...(focus?.serviceSlug ? [] : [await launchCityFaqJsonLd(name)]),
        ]}
      />
      {photo ? (
        <PlaceMapHero
          bullets={photo.bullets}
          description={photo.subtitle}
          primaryHref={bookingHref}
          primaryLabel={photo.bookCta}
          showReviews
          title={photo.title}
        />
      ) : (
        <PlaceMapHero
          description={priorityArea?.seoIntro ?? HERO_DESCRIPTION}
          eyebrow={heroEyebrow(name, focus)}
          primaryHref={bookingHref}
          primaryLabel={`Book in ${name}`}
          secondaryHref={bookingHref}
          secondaryLabel="Get a quote"
          title={title}
        />
      )}
      <PlaceFeatureBand />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus={
            categoryFocus === "commercial" ||
            categoryFocus === "recovery" ||
            categoryFocus === "residential" ||
            categoryFocus === "moving_home" ||
            categoryFocus === "short_term_rental"
              ? categoryFocus
              : undefined
          }
          cleanerLimit={18}
          place={name}
          placeLinks={placeLinks}
          allAreasCovered={allAreasCovered}
          placePath={barePath}
          placesNote={placesNote}
          priorityArea={priorityArea ?? undefined}
          serviceFocus={service ?? undefined}
          showAreaCards={false}
          showCategoryServices={Boolean(focus?.category)}
          showFaqs={!focus?.serviceSlug}
          showNearbyTowns={showNearbyTowns}
          surroundingLinks={surroundingLinks}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
