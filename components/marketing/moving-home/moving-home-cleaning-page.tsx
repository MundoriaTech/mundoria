"use client";

import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { MOVING_HOME_PAGE } from "@/components/marketing/service-category/category-page-configs";

export function MovingHomeCleaningPage({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <ServiceCategoryMarketingPage
      bookingHref={bookingHref}
      config={MOVING_HOME_PAGE}
    />
  );
}
