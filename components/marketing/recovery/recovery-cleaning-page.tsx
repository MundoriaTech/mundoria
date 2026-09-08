"use client";

import { ServiceCategoryMarketingPage } from "@/components/marketing/service-category/service-category-marketing-page";
import { RECOVERY_PAGE } from "@/components/marketing/service-category/category-page-configs";

export function RecoveryCleaningPage({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <ServiceCategoryMarketingPage
      bookingHref={bookingHref}
      config={RECOVERY_PAGE}
    />
  );
}
