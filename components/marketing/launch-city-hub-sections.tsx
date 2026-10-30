import { BirminghamPlaceFaqList } from "@/components/marketing/birmingham-place-faq-list";
import {
  CategoryMagLinks,
  magCategoryFor,
} from "@/components/marketing/category-mag-links";
import {
  BrandedCardLink,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { CategoryServiceCard } from "@/components/marketing/service-category/category-service-card";
import {
  LocationFeaturedCleaners,
  LocationNearPlacePills,
  LocationReviews,
} from "@/components/marketing/location-seo-sections";
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  reviewsOrFallback,
} from "@/lib/seo/birmingham-directory";
import { marketingServiceCardImage } from "@/lib/seo/service-detail-config";
import { birminghamPlaceFaqSchemaAnswers } from "@/lib/seo/birmingham-place-faqs";
import { BIRMINGHAM_LOCATION_CLEANERS } from "@/lib/seo/location-social-proof";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  publicMarketingServices,
  serviceCardHref,
  type MarketingService,
} from "@/lib/seo/marketing";
import { coverageFocusSearch } from "@/lib/seo/birmingham-coverage";

const PLACE = LAUNCH_CITY.name;

/** Service cards already shown higher on each category page. */
const SERVICES_ALREADY_ON_PAGE = {
  commercial: [
    "office-cleaning",
    "retail-and-hospitality-cleaning",
    "educational-facility-cleaning",
    "communal-area-cleaning",
  ],
  recovery: [
    "pregnancy-and-postpartum-cleaning",
    "illness-and-injury-recovery",
    "hospital-discharge-home-cleaning",
    "bereavement-support-cleaning",
  ],
  residential: [
    "regular-cleaning",
    "move-in-move-out-cleaning",
    "one-off-cleaning",
    "end-of-tenancy-cleaning",
    "airbnb-shortlet-cleaning",
  ],
} as const;

const CATEGORY_SERVICE_TITLE = {
  commercial: "Choose your workspace cleaning service",
  recovery: "Choose your recovery cleaning service",
  residential: "Choose your residential cleaning service",
} as const;

const DIFFERENT_SERVICE_ORDER = [
  "deep-cleaning",
  "holiday-let-cleaning",
  "office-cleaning",
  "pregnancy-and-postpartum-cleaning",
  "regular-cleaning",
  "airbnb-shortlet-cleaning",
  "serviced-accommodation-cleaning",
  "end-of-tenancy-cleaning",
  "illness-and-injury-recovery",
  "one-off-cleaning",
] as const;

function categoryCleaningServices(
  categoryFocus: "commercial" | "recovery" | "residential",
) {
  const bySlug = new Map(
    publicMarketingServices().map((service) => [service.slug, service]),
  );
  return SERVICES_ALREADY_ON_PAGE[categoryFocus].flatMap((slug) => {
    const service = bySlug.get(slug);
    return service ? [service] : [];
  });
}

function differentCleaningServices(
  categoryFocus?: "commercial" | "recovery" | "residential",
  excludeSlug?: string,
) {
  const excluded = new Set<string>(
    categoryFocus ? SERVICES_ALREADY_ON_PAGE[categoryFocus] : [],
  );
  if (excludeSlug) excluded.add(excludeSlug);
  const bySlug = new Map(
    publicMarketingServices().map((service) => [service.slug, service]),
  );

  return DIFFERENT_SERVICE_ORDER.flatMap((slug) => {
    if (excluded.has(slug)) return [];
    const service = bySlug.get(slug);
    return service ? [service] : [];
  }).slice(0, 4);
}

export async function LaunchCityHubSections({
  bookingHref,
  categoryFocus,
  cleanerLimit = 12,
  serviceFocus,
  showAreaCards = true,
  showCategoryServices = false,
  showFaqs = true,
  showFeatured = true,
  showLookingForDifferent = true,
  showReviews = true,
  place = PLACE,
  placeLinks,
  placesNote,
  showNearbyTowns = false,
  surroundingLinks,
}: {
  bookingHref: string;
  categoryFocus?: "commercial" | "recovery" | "residential";
  cleanerLimit?: number;
  serviceFocus?: MarketingService;
  showAreaCards?: boolean;
  showCategoryServices?: boolean;
  showFaqs?: boolean;
  showFeatured?: boolean;
  showLookingForDifferent?: boolean;
  showReviews?: boolean;
  place?: string;
  placeLinks?: Array<{ href: string; label: string }>;
  placesNote?: string;
  showNearbyTowns?: boolean;
  surroundingLinks?: Array<{ href: string; label: string }>;
}) {
  const liveCleaners = await loadDirectoryCleaners({
    areaSlug: undefined,
    limit: cleanerLimit,
    serviceType: serviceFocus?.value,
  });
  const featured = liveCleaners?.length
    ? liveCleaners
    : [...BIRMINGHAM_LOCATION_CLEANERS].slice(0, cleanerLimit);
  const reviews = reviewsOrFallback(await loadDirectoryReviews({ limit: 9 }));
  const lookingFor = differentCleaningServices(
    categoryFocus,
    serviceFocus?.slug,
  );
  const categoryServices =
    showCategoryServices && categoryFocus
      ? categoryCleaningServices(categoryFocus)
      : [];
  const categoryServiceTitle = categoryFocus
    ? CATEGORY_SERVICE_TITLE[categoryFocus]
    : null;
  const listNearbyTowns = showNearbyTowns || !placeLinks;

  return (
    <>
      {categoryServiceTitle && categoryServices.length ? (
        <BrandedSection>
          <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            {categoryServiceTitle}
          </h2>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-5 lg:overflow-visible lg:pb-0">
            {categoryServices.map((service) => (
              <CategoryServiceCard
                bookingHref={bookingHref}
                href={serviceCardHref(service.slug)}
                image={marketingServiceCardImage(service)}
                key={service.slug}
                label={`${service.label} in ${place}`}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 260px, 240px"
              />
            ))}
          </div>
        </BrandedSection>
      ) : null}

      {showFeatured && featured.length ? (
        <LocationFeaturedCleaners
          bookingHref={bookingHref}
          cleaners={featured}
          place={place}
        />
      ) : null}

      {showLookingForDifferent && lookingFor.length ? (
        <BrandedSection tone="lavender">
          <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            Looking for something different in cleaning?
          </h2>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-5 lg:overflow-visible lg:pb-0">
            {lookingFor.map((service) => (
              <CategoryServiceCard
                bookingHref={bookingHref}
                href={`/cleaning/${service.slug}`}
                image={marketingServiceCardImage(service)}
                key={service.slug}
                label={service.label}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 260px, 240px"
              />
            ))}
          </div>
        </BrandedSection>
      ) : null}

      {showReviews ? <LocationReviews place={place} reviews={reviews} /> : null}

      <LocationNearPlacePills
        categoryFocus={categoryFocus}
        links={placeLinks}
        place={place}
        placesNote={placesNote}
        serviceLabel={serviceFocus?.label}
        serviceSlug={serviceFocus?.slug}
        showNearbyTowns={listNearbyTowns}
        surroundingLinks={surroundingLinks}
      />

      {showAreaCards ? (
        <BrandedSection>
          <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            Neighbourhoods we prioritise
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
            Mundoria cleaners are available in these Birmingham areas and their
            surroundings:
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIRMINGHAM_AREAS.map((area) => (
              <BrandedCardLink
                description={area.description}
                href={`/cleaners/${LAUNCH_CITY.slug}/${area.slug}${coverageFocusSearch({
                  category: categoryFocus,
                  serviceSlug: serviceFocus?.slug,
                })}`}
                key={area.slug}
                label={area.name}
                meta={place}
              />
            ))}
          </div>
        </BrandedSection>
      ) : null}

      {(() => {
        const magCategory =
          categoryFocus ?? magCategoryFor(serviceFocus?.category);
        return magCategory ? (
          <CategoryMagLinks
            category={magCategory}
            serviceSlug={serviceFocus?.slug}
          />
        ) : null;
      })()}

      {showFaqs ? (
        <BirminghamPlaceFaqList bookingHref={bookingHref} place={place} />
      ) : null}

    </>
  );
}

export function launchCityFaqJsonLd(place: string = PLACE) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: birminghamPlaceFaqSchemaAnswers(place).map((item) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: item.answer },
      name: item.question,
    })),
  };
}
