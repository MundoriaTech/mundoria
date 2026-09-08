"use client";

import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { SHORT_LETS_PAGE } from "@/components/marketing/service-category/category-page-configs";

export function ShortLetsCleaningPage({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <ServiceCategoryMarketingPage
      bookingHref={bookingHref}
      config={SHORT_LETS_PAGE}
    />
  );
}
