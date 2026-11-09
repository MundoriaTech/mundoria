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
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  reviewsOrFallback,
} from "@/lib/seo/birmingham-directory";
import { marketingServiceCardImage } from "@/lib/seo/service-detail-config";
import { birminghamPlaceFaqSchemaAnswers } from "@/lib/seo/birmingham-place-faqs";
import { BIRMINGHAM_LOCATION_CLEANERS } from "@/lib/seo/location-social-proof";
import { canonicalCleaningPath } from "@/lib/seo/canonical";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  publicMarketingServices,
  serviceCardHref,
  type MarketingArea,
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
  moving_home: [
    "move-in-move-out-cleaning",
    "end-of-tenancy-cleaning",
  ],
  recovery: [
    "pregnancy-and-postpartum-cleaning",
    "illness-and-injury-recovery",
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

const CATEGORY_SERVICE_TITLE = {
  commercial: "Choose your workspace cleaning service",
  moving_home: "Choose your moving home cleaning service",
  recovery: "Choose your recovery cleaning service",
  residential: "Choose your house cleaning service",
  short_term_rental: "Choose your short-let cleaning service",
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
  "illness-and-injury-recovery",
  "one-off-cleaning",
] as const;

function categoryCleaningServices(categoryFocus: HubCategory) {
  const bySlug = new Map(
    publicMarketingServices().map((service) => [service.slug, service]),
  );
  return SERVICES_ALREADY_ON_PAGE[categoryFocus].flatMap((slug) => {
    const service = bySlug.get(slug);
    return service ? [service] : [];
  });
}

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
  allAreasCovered,
  placeLinks,
  placePath,
  placesNote,
  priorityArea,
  showNearbyTowns = false,
  surroundingLinks,
}: {
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

  const areasCoveredText = allAreasCovered?.length
    ? `Mundoria provides vetted cleaners across ${place}, including ${allAreasCovered.join(", ")} and surrounding postcodes.`
    : null;

  return (
    <>
      {categoryServiceTitle && categoryServices.length ? (
        <BrandedSection>
          <CategoryServicesCarousel
            label="services"
            title={
              <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
                {categoryServiceTitle}
              </h2>
            }
          >
            {categoryServices.map((service) => (
              <CategoryServiceCard
                bookingHref={bookingHref}
                href={
                  placePath
                    ? `${placePath}?service=${encodeURIComponent(service.slug)}`
                    : serviceCardHref(service.slug)
                }
                image={marketingServiceCardImage(service)}
                key={service.slug}
                label={`${service.label} in ${place}`}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 260px, 240px"
              />
            ))}
          </CategoryServicesCarousel>
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

      {showReviews ? <LocationReviews place={place} reviews={reviews} /> : null}

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
          {priorityArea.faqs.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {priorityArea.faqs.map((item) => (
                <div
                  className="rounded-2xl border border-[#ebe4da] bg-white/80 p-4"
                  key={item.question}
                >
                  <p className="text-sm font-semibold text-[#1c133b]">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
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

export async function launchCityFaqJsonLd(place: string = PLACE) {
  const { loadServicePricing } = await import("@/lib/customer/pricing-config");
  const pricing = await loadServicePricing();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: birminghamPlaceFaqSchemaAnswers(place, pricing).map(
      (item) => ({
        "@type": "Question",
        acceptedAnswer: { "@type": "Answer", text: item.answer },
        name: item.question,
      }),
    ),
  };
}
