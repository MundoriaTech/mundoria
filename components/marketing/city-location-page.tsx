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
import {
  LAUNCH_CITY,
  marketingServiceBySlug,
  type ServiceCardLocation,
} from "@/lib/seo/marketing";
import {
  cleaningPlaceTitle,
  type PlacePageFocus,
} from "@/lib/seo/place-page-focus";
import { absoluteUrl } from "@/lib/seo/site";

const HERO_DESCRIPTION =
  "One-off or regular house cleaning with tried & vetted cleaners in your area — clear estimates from booking to checklist.";

function heroEyebrow(name: string, focus?: PlacePageFocus) {
  const lead = focus?.serviceLabel
    ? focus.serviceLabel
    : focus?.category === "commercial"
      ? "Commercial"
      : focus?.category === "recovery"
        ? "Recovery"
        : focus?.category === "residential"
          ? "Residential"
          : null;
  return lead
    ? `${lead} · ${name} · From clear online estimates`
    : `${name} · From clear online estimates`;
}

export async function CityLocationPage({
  bookingHref,
  focus,
  name,
  path,
  placeLinks,
  placesNote,
  serviceCardLocation,
  showNearbyTowns = false,
  surroundingLinks,
}: {
  bookingHref: string;
  focus?: PlacePageFocus;
  name: string;
  path: string;
  placeLinks?: Array<{ href: string; label: string }>;
  placesNote?: string;
  serviceCardLocation?: ServiceCardLocation;
  showNearbyTowns?: boolean;
  surroundingLinks?: Array<{ href: string; label: string }>;
}) {
  const service = focus?.serviceSlug
    ? marketingServiceBySlug(focus.serviceSlug)
    : null;
  const categoryFocus =
    focus?.category ??
    (service?.category === "commercial" ||
    service?.category === "residential" ||
    service?.category === "recovery"
      ? service.category
      : undefined);
  const title = cleaningPlaceTitle({
    category: focus?.category,
    place: name,
    preposition: "in",
    serviceLabel: focus?.serviceLabel,
  });

  const photo = placePhotoHero(name, focus);

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
                item: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`),
                name: "Cleaners in Birmingham",
                position: 2,
              },
              {
                "@type": "ListItem",
                item: absoluteUrl(path),
                name: title,
                position: 3,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            areaServed: { "@type": "Place", name: `${name}, Birmingham` },
            description: HERO_DESCRIPTION,
            name: title,
            provider: {
              "@type": "Organization",
              name: "Mundoria",
              url: absoluteUrl("/"),
            },
            url: absoluteUrl(path),
          },
          ...(focus?.serviceSlug ? [] : [launchCityFaqJsonLd(name)]),
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
          description={HERO_DESCRIPTION}
          eyebrow={heroEyebrow(name, focus)}
          primaryHref={bookingHref}
          primaryLabel={`Book in ${name}`}
          secondaryHref="/cleaning"
          secondaryLabel="Browse services"
          title={title}
        />
      )}
      <PlaceFeatureBand focus={focus} />
      <BrandedPageWash>
        <LaunchCityHubSections
          bookingHref={bookingHref}
          categoryFocus={categoryFocus}
          cleanerLimit={18}
          place={name}
          placeLinks={placeLinks}
          placesNote={placesNote}
          serviceCardLocation={serviceCardLocation}
          serviceFocus={service ?? undefined}
          showAreaCards={!focus?.category && !focus?.serviceSlug}
          showCategoryServices={Boolean(focus?.category)}
          showFaqs={!focus?.serviceSlug}
          showNearbyTowns={showNearbyTowns}
          surroundingLinks={surroundingLinks}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
