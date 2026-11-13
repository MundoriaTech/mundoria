import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/landing/hero-section";
import { LandingPurpleField } from "@/components/marketing/landing/landing-purple-field";
import { ServiceCategoriesSection } from "@/components/marketing/landing/service-categories-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { houseCleaningFromLabel } from "@/lib/customer/published-pricing";
import { loadPageDirectoryContent } from "@/lib/marketing/page-directory";
import { getPublicMarketingServices } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { homePageStructuredData } from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const PopularServicesSection = nextDynamic(() =>
  import("@/components/marketing/landing/popular-services-section").then(
    (module) => ({ default: module.PopularServicesSection }),
  ),
);

const HowMundoriaWorksSection = nextDynamic(() =>
  import("@/components/marketing/landing/how-mundoria-works-section").then(
    (module) => ({ default: module.HowMundoriaWorksSection }),
  ),
);

const ReviewsSection = nextDynamic(() =>
  import("@/components/marketing/landing/reviews-section").then(
    (module) => ({ default: module.ReviewsSection }),
  ),
);

const AboutSection = nextDynamic(() =>
  import("@/components/marketing/landing/about-section").then(
    (module) => ({ default: module.AboutSection }),
  ),
);

const CoverageSection = nextDynamic(() =>
  import("@/components/marketing/landing/coverage-section").then(
    (module) => ({ default: module.CoverageSection }),
  ),
);

export async function generateMetadata(): Promise<Metadata> {
  // Live admin rate card: the same figure the cards and booking flow use.
  const from = houseCleaningFromLabel(await loadServicePricing());
  return buildPageMetadata({
    description: `Book vetted house cleaners in Birmingham from ${from}. Regular, deep, end of tenancy and Airbnb cleaning with live status and secure payment.`,
    path: "/",
    title: `House Cleaners Birmingham from ${from}`,
  });
}

/**
 * Cached for 5 minutes instead of rendered on every request (the audit saw
 * 12 s first responses). Rate-card changes appear within that window.
 */
export const revalidate = 300;

export default async function HomePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const customerHref = bookingHref;
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";
  const pricedServices = await getPublicMarketingServices();
  const { reviews } = await loadPageDirectoryContent({ reviewLimit: 40 });

  return (
    <MarketingShell>
      <JsonLd data={homePageStructuredData(pricedServices)} />
      <LandingPurpleField>
        <HeroSection bookingHref={bookingHref} />
        <ServiceCategoriesSection bookingHref={bookingHref} />
        <PopularServicesSection bookingBaseHref={bookingHref} />
      </LandingPurpleField>
      <HowMundoriaWorksSection />
      <ReviewsSection
        heading="Cleaning reviews in Birmingham"
        reviews={reviews}
      />
      <AboutSection cleanerHref={cleanerHref} customerHref={customerHref} />
      <CoverageSection />
    </MarketingShell>
  );
}
