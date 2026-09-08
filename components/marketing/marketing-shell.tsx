import Link from "next/link";
import type { ReactNode } from "react";

import { LandingFooter } from "@/components/marketing/landing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { Button } from "@/components/ui/button";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { isUserRole, type Profile } from "@/types/auth";

async function getMarketingViewer() {
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
  const cleanerHref = configured ? "/signup" : "/setup";
  const viewer = await getMarketingViewer();

  return (
    <main className={cn("min-h-screen bg-background text-foreground", className)}>
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      {children}
      <LandingFooter cleanerHref={cleanerHref} configured={configured} />
    </main>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  description: string;
  eyebrow?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  title: string;
}) {
  return (
    <section className="border-b border-border bg-muted/40 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {eyebrow ? (
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-full bg-foreground px-6 font-black text-background hover:bg-foreground/90"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button
              asChild
              className="h-12 rounded-full px-6 font-black"
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
