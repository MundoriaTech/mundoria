import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

import { HeroSection } from "@/components/marketing/landing/hero-section";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { ServiceCategoriesSection } from "@/components/marketing/landing/service-categories-section";
import { JsonLd } from "@/components/marketing/json-ld";
import { buildPageMetadata } from "@/lib/seo/site";
import { homePageStructuredData } from "@/lib/seo/structured-data";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole, type Profile } from "@/types/auth";

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

const LandingFooter = nextDynamic(() =>
  import("@/components/marketing/landing/landing-footer").then(
    (module) => ({ default: module.LandingFooter }),
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

  let viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null =
    null;
  if (configured) {
    try {
      const supabase = createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name,avatar_url,role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile && isUserRole(profile.role)) {
          viewer = profile;
        }
      }
    } catch {
      viewer = null;
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd data={homePageStructuredData()} />
      <LandingNavbar customerHref={customerHref} viewer={viewer} />
      <HeroSection bookingHref={bookingHref} />
      <ServiceCategoriesSection bookingHref={bookingHref} />
      <PopularServicesSection bookingBaseHref={bookingHref} />
      <HowItWorksSection />
      <ReviewsSection />
      <AboutSection cleanerHref={cleanerHref} customerHref={customerHref} />
      <CoverageSection />
      <WelcomeSection customerHref={customerHref} />
      <LandingFooter cleanerHref={cleanerHref} configured={configured} />
    </main>
  );
}
