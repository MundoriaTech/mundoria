"use client";

import type { FeaturedCleanerCardData } from "@/components/marketing/featured-cleaner-cards";
import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { MOVING_HOME_PAGE } from "@/components/marketing/service-category/category-page-configs";
import type { LandingReview } from "@/lib/marketing/landing-reviews";

export function MovingHomeCleaningPage({
  bookingHref,
  cleaners = [],
  reviews = [],
  showFaqs = true,
}: {
  bookingHref: string;
  cleaners?: FeaturedCleanerCardData[];
  reviews?: LandingReview[];
  showFaqs?: boolean;
}) {
  return (
    <ServiceCategoryMarketingPage
      bookingHref={bookingHref}
      cleaners={cleaners}
      config={MOVING_HOME_PAGE}
      reviews={reviews}
      showFaqs={showFaqs}
    />
  );
}
