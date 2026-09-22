"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import {
  AccountMenu,
  type AccountMenuItem,
} from "@/components/shared/account-menu";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

export type AppShellNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return desktop;
}

export function AppDashboardShell({
  accountMenuItems,
  brandHref,
  brandLabel,
  children,
  headerExtra,
  navItems,
  profile,
  topSlot,
}: {
  accountMenuItems: AccountMenuItem[];
  brandHref: string;
  brandLabel?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  navItems: AppShellNavItem[];
  profile: {
    avatar_url?: string | null;
    full_name: string;
    id: string;
    role: UserRole;
  };
  roleLabel?: string;
  topSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const desktop = useIsDesktop();
  const cols = Math.min(Math.max(navItems.length, 3), 5);
  const bookingHref = hasSupabasePublicConfig() ? "/booking/new" : "/setup";
  const viewer = {
    avatar_url: profile.avatar_url ?? null,
    full_name: profile.full_name,
    id: profile.id,
    role: profile.role,
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#1c133b] dark:bg-background dark:text-foreground">
      {desktop ? (
        <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      ) : null}

      {!desktop ? (
        <header className="sticky top-0 z-30 border-b border-[#ece3f9]/90 bg-[#faf8ff]/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-border dark:bg-background/90">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <div className="min-w-0">
              <LandingLogo className="text-[1.25rem]" href={brandHref} />
              {brandLabel ? (
                <p className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
                  {brandLabel}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerExtra}
              <AccountMenu items={accountMenuItems} profile={profile} />
            </div>
          </div>
        </header>
      ) : null}

      <div
        className="mx-auto flex w-full max-w-6xl gap-6 px-4 sm:px-6 md:gap-8 md:px-6 lg:px-8"
        style={
          {
            ["--dash-nav-clear" as string]: `calc(${LANDING_NAV_BLOCK} + 0.75rem)`,
          } as React.CSSProperties
        }
      >
        {desktop ? (
          <aside className="relative z-20 w-[12.5rem] shrink-0 lg:w-[13.5rem]">
            <div
              className="sticky flex flex-col gap-6 pb-8 pt-1"
              style={{ top: "var(--dash-nav-clear)" }}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                {brandLabel ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b8798]">
                    {brandLabel}
                  </p>
                ) : (
                  <span />
                )}
                {headerExtra ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {headerExtra}
                  </div>
                ) : null}
              </div>

              <nav aria-label="App navigation" className="flex flex-col gap-0.5">
                {navItems.map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium tracking-tight transition",
                        active
                          ? "bg-white text-[#1c133b] shadow-[0_1px_2px_rgba(28,19,59,0.06)] ring-1 ring-[#ece3f9]"
                          : "text-[#6b6680] hover:bg-white/70 hover:text-[#1c133b] dark:text-muted-foreground dark:hover:bg-muted",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      <Icon
                        className={cn(
                          "h-[1.1rem] w-[1.1rem] shrink-0",
                          active ? "text-[#6a45b8]" : "text-[#9a94a8]",
                        )}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:py-8 md:pb-10 md:pt-2">
          {topSlot}
          {children}
        </main>
      </div>

      {!desktop ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ece3f9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-border dark:bg-background/95">
          <div
            className="mx-auto grid h-16 max-w-lg"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                    active
                      ? "text-[#1c133b] dark:text-primary"
                      : "text-[#8b8798] dark:text-muted-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function isActive(pathname: string, item: AppShellNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
