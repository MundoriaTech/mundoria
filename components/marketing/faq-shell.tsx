import type { ReactNode } from "react";

import { LandingFooter } from "@/components/marketing/landing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { SupportMessengerWidget } from "@/components/support/support-messenger";
import { faqNavMenus } from "@/lib/seo/site-faqs";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** FAQ page chrome, floating marketing nav with FAQ category dropdowns. */
export function FaqShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[#faf8ff] text-foreground",
        className,
      )}
    >
      <LandingNavbar customerHref={bookingHref} faqNav={faqNavMenus()} />

      <main
        className="flex-1"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 0.5rem)` }}
      >
        {children}
      </main>

      <LandingFooter cleanerHref={cleanerHref} configured={configured} />
      <SupportMessengerWidget />
    </div>
  );
}
