import type { FeaturedCleanerCardData } from "@/components/marketing/featured-cleaner-cards";
import { servicesForCategory } from "@/lib/customer/services";
import type { LandingReview } from "@/lib/marketing/landing-reviews";
import { directoryReviewsToLandingReviews } from "@/lib/marketing/location-review-display";
import {
  loadDirectoryCleaners,
  loadDirectoryReviews,
  publishedReviews,
  type DirectoryCleaner,
} from "@/lib/seo/birmingham-directory";
import type { ServiceCategory, ServiceType } from "@/types/customer";

export function serviceTypesForCategory(
  category: ServiceCategory,
): ServiceType[] {
  return servicesForCategory(category).map((service) => service.value);
}

export function toFeaturedCleanerCards(
  cleaners: DirectoryCleaner[],
): FeaturedCleanerCardData[] {
  return cleaners.map((cleaner) => ({
    areas: cleaner.areas,
    avatarUrl: cleaner.avatarUrl,
    href: cleaner.href,
    jobs: cleaner.jobs,
    name: cleaner.name,
    prefixes: cleaner.prefixes,
    radiusMiles: cleaner.radiusMiles,
    rating: cleaner.rating,
    reviewCount: cleaner.reviewCount,
  }));
}

/** Cleaners + landing reviews for a marketing page, scoped by place/service. */
export async function loadPageDirectoryContent(options?: {
  areaSlug?: string;
  category?: ServiceCategory;
  cleanerLimit?: number;
  reviewLimit?: number;
  serviceType?: ServiceType | string;
}) {
  const serviceTypes = options?.serviceType
    ? [String(options.serviceType)]
    : options?.category
      ? serviceTypesForCategory(options.category).map(String)
      : undefined;

  const [liveCleaners, scopedReviews] = await Promise.all([
    loadDirectoryCleaners({
      areaSlug: options?.areaSlug,
      limit: options?.cleanerLimit ?? 24,
      serviceType:
        serviceTypes?.length === 1 ? serviceTypes[0] : undefined,
      serviceTypes:
        serviceTypes && serviceTypes.length > 1 ? serviceTypes : undefined,
    }),
    loadDirectoryReviews({
      areaSlug: options?.areaSlug,
      limit: options?.reviewLimit ?? 40,
      serviceType:
        serviceTypes?.length === 1 ? serviceTypes[0] : undefined,
      serviceTypes:
        serviceTypes && serviceTypes.length > 1 ? serviceTypes : undefined,
    }),
  ]);

  // Keep category/service scope — never fall back to unscoped reviews or a
  // House page can show Workspace/office copy (and vice versa).
  const liveReviews = scopedReviews;

  let cleaners = liveCleaners ?? [];
  if (!cleaners.length && serviceTypes?.length) {
    cleaners =
      (await loadDirectoryCleaners({
        areaSlug: options?.areaSlug,
        limit: options?.cleanerLimit ?? 24,
      })) ?? [];
  }

  const reviews: LandingReview[] = directoryReviewsToLandingReviews(
    publishedReviews(liveReviews, options?.reviewLimit ?? 40),
  );

  return {
    cleaners: toFeaturedCleanerCards(cleaners),
    reviews,
  };
}
