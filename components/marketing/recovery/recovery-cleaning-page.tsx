"use client";

import type { FeaturedCleanerCardData } from "@/components/marketing/featured-cleaner-cards";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { RECOVERY_PAGE } from "@/components/marketing/service-category/category-page-configs";
import type { LandingReview } from "@/lib/marketing/landing-reviews";

export function RecoveryCleaningPage({
  bookingHref,
  cleaners = [],
  reviews = [],
}: {
  bookingHref: string;
  cleaners?: FeaturedCleanerCardData[];
  reviews?: LandingReview[];
}) {
  return (
    <ServiceCategoryMarketingPage
      bookingHref={bookingHref}
      cleaners={cleaners}
      config={RECOVERY_PAGE}
      reviews={reviews}
      showFaqs={false}
    />
  );
}
