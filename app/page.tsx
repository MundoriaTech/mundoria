import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/landing/hero-section";
import { LandingPurpleField } from "@/components/marketing/landing/landing-purple-field";
import { ServiceCategoriesSection } from "@/components/marketing/landing/service-categories-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { getPublicMarketingServices } from "@/lib/seo/marketing";
import { onpageCopyForPath } from "@/lib/seo/onpage-copy";
import { buildPageMetadata } from "@/lib/seo/site";
import { homePageStructuredData } from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const homeCopy = onpageCopyForPath("/")!;

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

export const metadata: Metadata = buildPageMetadata({
  description: homeCopy.description,
  path: "/",
  title: homeCopy.title,
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const customerHref = bookingHref;
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";
  const pricedServices = await getPublicMarketingServices();
  const fromPriceBySlug = Object.fromEntries(
    pricedServices.map((service) => [service.slug, service.fromPrice]),
  );

  return (
    <MarketingShell>
      <JsonLd data={homePageStructuredData(pricedServices)} />
      <LandingPurpleField>
        <HeroSection bookingHref={bookingHref} />
        <ServiceCategoriesSection
          bookingHref={bookingHref}
          fromPriceBySlug={fromPriceBySlug}
        />
        <PopularServicesSection bookingBaseHref={bookingHref} />
      </LandingPurpleField>
      <HowMundoriaWorksSection />
      <ReviewsSection />
      <AboutSection cleanerHref={cleanerHref} customerHref={customerHref} />
      <CoverageSection />
    </MarketingShell>
  );
}
