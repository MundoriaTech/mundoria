import Link from "next/link";
import type { ReactNode } from "react";

import { LandingFooter } from "@/components/marketing/landing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { ZohoSalesIqWidget } from "@/components/shared/zoho-salesiq";
import { Button } from "@/components/ui/button";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { isUserRole, type Profile } from "@/types/auth";

export async function getMarketingViewer() {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && isUserRole(profile.role)) {
      return profile as Pick<
        Profile,
        "id" | "full_name" | "avatar_url" | "role"
      >;
    }
  } catch {
    return null;
  }

  return null;
}

export async function MarketingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";
  const viewer = await getMarketingViewer();

  return (
    <main className={cn("min-h-screen bg-background text-foreground", className)}>
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      {children}
      <LandingFooter cleanerHref={cleanerHref} configured={configured} />
      <ZohoSalesIqWidget />
    </main>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  primaryOpensChat,
  secondaryHref,
  secondaryLabel,
  underNav = false,
  showBrand = true,
}: {
  description: string;
  eyebrow?: string;
  primaryHref?: string;
  primaryLabel: string;
  /** When true, primary CTA opens in-app chat instead of navigating. */
  primaryOpensChat?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  title: string;
  /** Extra top padding when the parent wash is pulled under the sticky navbar. */
  underNav?: boolean;
  /** Show the Mundoria wordmark above the eyebrow/title. */
  showBrand?: boolean;
}) {
  const primaryClass =
    "inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-black text-white transition hover:bg-[#5a38a3]";

  return (
    <section
      className={cn(
        "border-b border-[#eadfce]/80 bg-[#f7f2ea] px-5 sm:px-8",
        underNav ? "pb-16 sm:pb-20" : "py-16 sm:py-20",
      )}
      style={
        underNav
          ? { paddingTop: `calc(${LANDING_NAV_BLOCK} + 3.5rem)` }
          : undefined
      }
    >
      <div className="mx-auto max-w-4xl">
        {showBrand ? (
          <p className="text-[1.35rem] font-black tracking-[-0.06em] text-[#1c133b] sm:text-[1.55rem]">
            Mundoria
          </p>
        ) : null}
        {eyebrow ? (
          <p
            className={cn(
              "text-sm font-black uppercase tracking-[0.22em] text-[#823fb2]",
              showBrand ? "mt-5" : null,
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`text-4xl font-black tracking-[-0.05em] text-[#1c133b] sm:text-6xl ${
            eyebrow ? "mt-4" : "mt-5"
          }`}
        >
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-[#5a5470] sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {primaryOpensChat ? (
            <ContactSupportButton
              className={primaryClass}
              label={primaryLabel}
            />
          ) : primaryHref ? (
            <Button asChild className={primaryClass}>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Button
              asChild
              className="h-12 rounded-full border-[#d9ccef] bg-white/80 px-6 font-black text-[#312c79] hover:bg-white"
              variant="outline"
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
