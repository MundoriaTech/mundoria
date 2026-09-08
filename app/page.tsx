import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/landing/hero-section";
import { ServiceCategoriesSection } from "@/components/marketing/landing/service-categories-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { buildPageMetadata } from "@/lib/seo/site";
import { homePageStructuredData } from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const PopularServicesSection = nextDynamic(() =>
  import("@/components/marketing/landing/popular-services-section").then(
    (module) => ({ default: module.PopularServicesSection }),
  ),
);

const HowItWorksSection = nextDynamic(() =>
  import("@/components/marketing/landing/how-it-works-section").then(
    (module) => ({ default: module.HowItWorksSection }),
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

const WelcomeSection = nextDynamic(() =>
  import("@/components/marketing/landing/welcome-section").then(
    (module) => ({ default: module.WelcomeSection }),
  ),
);

export const metadata: Metadata = buildPageMetadata({
  description:
    "Book certified UK cleaning professionals for homes, workplaces, short-term rentals, exterior cleaning and recovery support with CleanScape.",
  path: "/",
  title: "CleanScape UK | Trusted cleaning, beautifully managed",
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const customerHref = bookingHref;
  const cleanerHref = configured ? "/signup" : "/setup";

  return (
    <MarketingShell>
      <JsonLd data={homePageStructuredData()} />
      <HeroSection bookingHref={bookingHref} />
      <ServiceCategoriesSection bookingHref={bookingHref} />
      <PopularServicesSection bookingBaseHref={bookingHref} />
      <HowItWorksSection />
      <ReviewsSection />
      <AboutSection cleanerHref={cleanerHref} customerHref={customerHref} />
      <CoverageSection />
      <WelcomeSection customerHref={customerHref} />
    </MarketingShell>
  );
}
