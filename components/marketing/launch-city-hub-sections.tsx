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
import { CategoryServicesCarousel } from "@/components/marketing/service-category/category-services-carousel";
import {
  LocationFeaturedCleaners,
  LocationNearPlacePills,
  LocationReviews,
} from "@/components/marketing/location-seo-sections";
import { serviceTypesForCategory } from "@/lib/marketing/page-directory";
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  publishedReviews,
} from "@/lib/seo/birmingham-directory";
import { marketingServiceCardImage } from "@/lib/seo/service-detail-config";
import { canonicalCleaningPath, cleanerPlacePath } from "@/lib/seo/canonical";
import {
  locationFaqContext,
  locationFaqJsonLd,
  locationFaqs,
} from "@/lib/seo/location-faqs";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  publicMarketingServices,
  type MarketingArea,
  type MarketingService,
} from "@/lib/seo/marketing";
import { coverageFocusSearch } from "@/lib/seo/birmingham-coverage";
import type { ServiceCategory } from "@/types/customer";

const PLACE = LAUNCH_CITY.name;

/** Service cards already shown higher on each category page. */
const SERVICES_ALREADY_ON_PAGE = {
  commercial: [
    "office-cleaning",
    "retail-and-hospitality-cleaning",
    "educational-facility-cleaning",
    "communal-area-cleaning",
  ],
  moving_home: [
    "move-in-move-out-cleaning",
    "end-of-tenancy-cleaning",
  ],
  recovery: [
    "pregnancy-and-postpartum-cleaning",
    "hospital-discharge-home-cleaning",
    "bereavement-support-cleaning",
  ],
  residential: [
    "regular-cleaning",
    "one-off-cleaning",
    "deep-cleaning",
  ],
  short_term_rental: [
    "airbnb-shortlet-cleaning",
    "serviced-accommodation-cleaning",
  ],
} as const;

type HubCategory = keyof typeof SERVICES_ALREADY_ON_PAGE;

/** Indexable canonical slugs only — never redirected twins. */
const DIFFERENT_SERVICE_ORDER = [
  "deep-cleaning",
  "office-cleaning",
  "pregnancy-and-postpartum-cleaning",
  "regular-cleaning",
  "airbnb-shortlet-cleaning",
  "serviced-accommodation-cleaning",
  "end-of-tenancy-cleaning",
  "move-in-move-out-cleaning",
  "hospital-discharge-home-cleaning",
  "one-off-cleaning",
] as const;

function differentCleaningServices(
  categoryFocus?: HubCategory,
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
    const canonical = canonicalCleaningPath(slug).replace("/cleaning/", "");
    if (excluded.has(slug) || excluded.has(canonical)) return [];
    const service = bySlug.get(canonical) ?? bySlug.get(slug);
    return service ? [service] : [];
  }).slice(0, 4);
}

export async function LaunchCityHubSections({
  areaSlug,
  bookingHref,
  categoryFocus,
  cleanerLimit = 24,
  serviceFocus,
  showAreaCards = true,
  showCategoryServices = false,
  showFaqs = true,
  showFeatured = true,
  showLookingForDifferent = true,
  showReviews = true,
  place = PLACE,
  allAreasCovered,
  placeLinks,
  placePath,
  placesNote,
  priorityArea,
  showNearbyTowns = false,
  surroundingLinks,
}: {
  areaSlug?: string;
  bookingHref: string;
  categoryFocus?: HubCategory;
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
  /** Full list of all areas covered, including those that redirect. Used for text SEO. */
  allAreasCovered?: string[];
  /** Current place URL (no query). Category service cards deep-link here with ?service=. */
  placePath?: string;
  placesNote?: string;
  priorityArea?: MarketingArea;
  showNearbyTowns?: boolean;
  surroundingLinks?: Array<{ href: string; label: string }>;
}) {
  const resolvedAreaSlug = areaSlug ?? priorityArea?.slug;
  const categoryServiceTypes =
    !serviceFocus && categoryFocus
      ? serviceTypesForCategory(categoryFocus as ServiceCategory).map(String)
      : undefined;

  let liveCleaners = await loadDirectoryCleaners({
    areaSlug: resolvedAreaSlug,
    limit: cleanerLimit,
    serviceType: serviceFocus?.value,
    serviceTypes: categoryServiceTypes,
  });
  const liveReviews = await loadDirectoryReviews({
    areaSlug: resolvedAreaSlug,
    limit: 40,
    serviceType: serviceFocus?.value,
    serviceTypes: categoryServiceTypes,
  });
  // Prefer scoped cleaners; fall back to place-wide cleaners only.
  // Reviews stay scoped — House pages must not show Workspace/office quotes.
  if (!(liveCleaners?.length) && (serviceFocus || categoryServiceTypes)) {
    liveCleaners = await loadDirectoryCleaners({
      areaSlug: resolvedAreaSlug,
      limit: cleanerLimit,
    });
  }
  // Real, active cleaner profiles only. No invented fallback cleaners.
  const featured = liveCleaners ?? [];
  const reviews = publishedReviews(liveReviews, 40);
  const lookingFor = differentCleaningServices(
    categoryFocus,
    serviceFocus?.slug,
  );
  const listNearbyTowns = showNearbyTowns || !placeLinks;

  const areasCoveredText = allAreasCovered?.length
    ? `Mundoria provides vetted cleaners across ${place}, including ${allAreasCovered.join(", ")} and surrounding postcodes.`
    : null;

  return (
    <>
      {showCategoryServices ? (
        <LocationReviews place={place} reviews={reviews} />
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
          <CategoryServicesCarousel
            fadeFromClassName="from-[#f3eef8]"
            label="other services"
            title={
              <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
                Looking for something different in cleaning?
              </h2>
            }
          >
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
          </CategoryServicesCarousel>
        </BrandedSection>
      ) : null}

      {showReviews && !showCategoryServices ? (
        <LocationReviews place={place} reviews={reviews} />
      ) : null}

      {areasCoveredText ? (
        <BrandedSection tone="cream">
          <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            Cleaning coverage in {place}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#5a5470]">{areasCoveredText}</p>
        </BrandedSection>
      ) : null}

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
            {place === PLACE
              ? "Mundoria cleaners are available in these Birmingham areas and their surroundings:"
              : `Priority neighbourhoods near ${place} and across Birmingham:`}
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

      {priorityArea && !serviceFocus ? (
        <BrandedSection tone="cream">
          <h2 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            Cleaning in {priorityArea.name}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5a5470]">
            {priorityArea.seoIntro}
          </p>
          {priorityArea.highlights.length ? (
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-[#5a5470]">
              {priorityArea.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
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
        <BirminghamPlaceFaqList
          bookingHref={bookingHref}
          place={place}
          placePath={placePath}
        />
      ) : null}

    </>
  );
}

/** FAQPage JSON-LD matching the visible location FAQ for this place. */
export async function launchCityFaqJsonLd(
  place: string = PLACE,
  placePath: string = cleanerPlacePath(LAUNCH_CITY.slug),
) {
  const { loadServicePricing } = await import("@/lib/customer/pricing-config");
  return locationFaqJsonLd(
    locationFaqs(locationFaqContext(place, placePath), await loadServicePricing()),
  );
}
