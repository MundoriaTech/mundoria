"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { AccountMenu } from "@/components/shared/account-menu";
import { cn } from "@/lib/utils";

export type AppShellNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

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
  accountMenuItems: Array<{
    href: string;
    icon: LucideIcon;
    label: string;
  }>;
  brandHref: string;
  brandLabel?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  navItems: AppShellNavItem[];
  profile: {
    avatar_url?: string | null;
    full_name: string;
    id: string;
  };
  roleLabel?: string;
  topSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const cols = Math.min(Math.max(navItems.length, 3), 5);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#1c133b] dark:bg-background dark:text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#ece3f9]/90 bg-[#faf8ff]/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-border dark:bg-background/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <div className="min-w-0">
              <LandingLogo
                className="text-[1.25rem] sm:text-[1.35rem]"
                href={brandHref}
              />
              {brandLabel ? (
                <p className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
                  {brandLabel}
                </p>
              ) : null}
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium tracking-tight transition",
                      active
                        ? "bg-[#1c133b] text-white"
                        : "text-[#3d3a48] hover:bg-[#f3eef8] dark:text-muted-foreground dark:hover:bg-muted",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {headerExtra}
            <AccountMenu items={accountMenuItems} profile={profile} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-10">
        {topSlot}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ece3f9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-border dark:bg-background/95 md:hidden">
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
    </div>
  );
}

function isActive(pathname: string, item: AppShellNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
