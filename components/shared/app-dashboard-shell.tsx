"use client";

import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { useFeedback } from "@/components/shared/feedback-provider";
import {
  AccountMenu,
  type AccountMenuItem,
} from "@/components/shared/account-menu";
import {
  appParentBackLink,
  DashboardBackLink,
} from "@/components/shared/dashboard-back-link";
import { NotificationBell } from "@/components/shared/notification-bell";
import { RouteProgress } from "@/components/shared/route-progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DURATION, EASE, SPRING } from "@/lib/motion";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

export type AppShellNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  /** Custom active test for routes that live under a different prefix. */
  match?: (pathname: string) => boolean;
};

export type AppShellNavGroup = {
  label?: string;
  items: AppShellNavItem[];
};

export type AppShellProfile = {
  avatar_url?: string | null;
  email?: string;
  full_name: string;
  id: string;
  role: UserRole;
};

/** How many items fit in the mobile tab bar before the rest move to "Menu". */
const MOBILE_TAB_LIMIT = 4;

function isActive(pathname: string, item: AppShellNavItem) {
  if (item.match) return item.match(pathname);
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function loginPathFor(pathname: string) {
  if (pathname.startsWith("/cleaner")) return "/login/cleaner";
  if (pathname.startsWith("/admin")) return "/admin/login";
  return "/login";
}

/**
 * The one shell for every signed-in surface (customer, cleaner, admin).
 * Desktop: compact app header + sticky sidebar. Mobile: compact header,
 * bottom tab bar with the first few destinations, and a slide-in drawer
 * for the full map. No marketing navigation anywhere inside the app.
 */
export function AppDashboardShell({
  accountMenuItems,
  brandHref,
  brandLabel,
  children,
  contentWidth = "default",
  fullBleed = false,
  headerActions,
  navGroups,
  notificationSlot,
  parentLink = appParentBackLink,
  profile,
  topSlot,
}: {
  accountMenuItems: AccountMenuItem[];
  brandHref: string;
  /** Small label beside the logo, e.g. "Pro" or "Operations". */
  brandLabel?: string;
  children: ReactNode;
  /** `wide` suits dense admin tables. */
  contentWidth?: "default" | "wide";
  /** Drop the main padding so a full-canvas editor can own the space. */
  fullBleed?: boolean;
  /** Primary action(s) in the header, e.g. "Book a clean". */
  headerActions?: ReactNode;
  navGroups: AppShellNavGroup[];
  /** Replaces the default notification bell. Pass `null` to hide it. */
  notificationSlot?: ReactNode | null;
  /** Resolves the "Back to …" link for nested routes. */
  parentLink?: (pathname: string) => { href: string; label: string } | null;
  profile: AppShellProfile;
  /** Rendered above the page content, e.g. account status banners. */
  topSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirm } = useFeedback();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const allItems = navGroups.flatMap((group) => group.items);
  const tabItems = allItems.slice(0, MOBILE_TAB_LIMIT);
  const backLink = parentLink(pathname);
  const widthClass =
    contentWidth === "wide" ? "max-w-[1600px]" : "max-w-6xl";

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  async function logout() {
    const confirmed = await confirm({
      action: "Log out",
      description: "You will need to sign in again to see your account.",
      title: "Log out of Mundoria?",
      variant: "destructive",
    });
    if (!confirmed) return;
    setSigningOut(true);
    await createBrowserClient().auth.signOut();
    router.replace(loginPathFor(pathname));
    router.refresh();
  }

  const bell =
    notificationSlot === undefined ? (
      <NotificationBell userId={profile.id} />
    ) : (
      notificationSlot
    );

  return (
    <div className="min-h-screen bg-brand-haze text-brand-ink">
      <RouteProgress />

      <header className="sticky top-0 z-40 border-b border-brand-line/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex h-[4.25rem] items-center gap-3 px-5 sm:px-6 md:h-16 lg:px-8",
            widthClass,
          )}
        >
          <button
            aria-expanded={drawerOpen}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-line bg-white text-brand-ink transition hover:bg-brand-surface md:hidden"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <LandingLogo className="h-6 sm:h-7" href={brandHref} />
            {brandLabel ? (
              <span className="hidden rounded-full bg-brand-lavender-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-violet sm:inline-block">
                {brandLabel}
              </span>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {headerActions ? (
              <div className="hidden items-center gap-2 sm:flex">
                {headerActions}
              </div>
            ) : null}
            {bell}
            <AccountMenu items={accountMenuItems} profile={profile} />
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto flex w-full gap-8 px-4 sm:px-6 lg:gap-10 lg:px-8",
          widthClass,
          fullBleed && "px-0 sm:px-0 lg:px-0",
        )}
      >
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] flex max-h-[calc(100dvh-4rem)] flex-col gap-6 overflow-y-auto py-8 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SidebarNav groups={navGroups} pathname={pathname} />
          </div>
        </aside>

        <main
          className={cn(
            "min-w-0 flex-1",
            fullBleed
              ? "py-0"
              : "py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:py-8 md:pb-12",
          )}
        >
          {backLink && !fullBleed ? (
            <DashboardBackLink
              className="mb-3 -ml-1"
              href={backLink.href}
              label={backLink.label}
            />
          ) : null}
          {topSlot}
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div
          className="mx-auto grid h-20 max-w-lg px-2 pt-1 pb-2.5"
          style={{
            gridTemplateColumns: `repeat(${tabItems.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {tabItems.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 rounded-xl text-[11px] font-medium transition-colors",
                  active ? "text-brand-ink" : "text-brand-subtle",
                )}
                href={item.href}
                key={item.href}
              >
                {active ? (
                  <motion.span
                    className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-brand-purple"
                    layoutId="app-tab-active"
                    transition={SPRING.snappy}
                  />
                ) : null}
                <Icon
                  className={cn("h-5 w-5", active && "text-brand-purple")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {item.label}
              </Link>
            );
          })}
          <button
            aria-expanded={drawerOpen}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              drawerOpen ? "text-brand-ink" : "text-brand-subtle",
            )}
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
            Menu
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-brand-ink/40 backdrop-blur-[2px] md:hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="drawer-backdrop"
              onClick={() => setDrawerOpen(false)}
              transition={{ duration: DURATION.base, ease: EASE.out }}
              type="button"
            />
            <motion.aside
              animate={{ x: 0 }}
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl md:hidden"
              exit={{
                transition: { duration: DURATION.base, ease: EASE.in },
                x: "-100%",
              }}
              initial={{ x: "-100%" }}
              key="drawer"
              transition={SPRING.gentle}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-line px-4 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-2.5">
                  <LandingLogo className="h-6" href={brandHref} />
                  {brandLabel ? (
                    <span className="rounded-full bg-brand-lavender-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-violet">
                      {brandLabel}
                    </span>
                  ) : null}
                </div>
                <button
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-surface hover:text-brand-ink"
                  onClick={() => setDrawerOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <SidebarNav
                  groups={navGroups}
                  indicatorId="app-drawer-active"
                  pathname={pathname}
                />
                {headerActions ? (
                  <div className="mt-5 flex flex-col gap-2 px-1 sm:hidden">
                    {headerActions}
                  </div>
                ) : null}
                <div className="mt-6 border-t border-brand-line pt-4">
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
                    Account
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {accountMenuItems.map((item) => (
                      <Link
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-brand-muted transition hover:bg-brand-surface hover:text-brand-ink"
                        href={item.href}
                        key={item.href}
                      >
                        <item.icon className="h-[1.1rem] w-[1.1rem] text-brand-violet" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-brand-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 rounded-2xl bg-brand-surface p-3">
                  <UserAvatar
                    name={profile.full_name}
                    seed={profile.id}
                    size="sm"
                    url={profile.avatar_url}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {profile.full_name}
                    </p>
                    {profile.email ? (
                      <p className="truncate text-xs text-brand-subtle">
                        {profile.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:opacity-60"
                  disabled={signingOut}
                  onClick={() => void logout()}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SidebarNav({
  groups,
  indicatorId = "app-sidebar-active",
  pathname,
}: {
  groups: AppShellNavGroup[];
  indicatorId?: string;
  pathname: string;
}) {
  return (
    <nav aria-label="App navigation" className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label ? (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
              {group.label}
            </p>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors",
                    active
                      ? "text-brand-ink"
                      : "text-brand-muted hover:bg-white/70 hover:text-brand-ink",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {active ? (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_2px_rgba(28,19,59,0.06)] ring-1 ring-brand-line"
                      layoutId={indicatorId}
                      transition={SPRING.snappy}
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "relative h-[1.1rem] w-[1.1rem] shrink-0",
                      active ? "text-brand-purple" : "text-brand-subtle",
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
