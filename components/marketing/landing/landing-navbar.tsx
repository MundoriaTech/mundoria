"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import {
  LANDING_NAV_PILL_H,
  LANDING_NAV_PILL_RADIUS,
  LANDING_NAV_TOP,
} from "@/components/marketing/landing/nav-metrics";
import { useLandingNavScrollHide } from "@/components/marketing/landing/use-nav-scroll-hide";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  landingCategoryNav,
  landingNavLinks,
} from "@/components/marketing/landing/constants";
import {
  AccountMenu,
  CLEANER_ACCOUNT_MENU,
  CUSTOMER_ACCOUNT_MENU,
  type AccountMenuItem,
} from "@/components/shared/account-menu";
import { dashboardForRole } from "@/lib/auth/redirects";
import { createBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { isUserRole, type Profile } from "@/types/auth";

type MarketingViewer = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "role"
> | null;

/**
 * Measured from Frame 105 (1024×92 export):
 * bar ~75px tall, corner radius ~18px (gently curved sides, not stadium),
 * lavender #e8e0f9, CTA pills ~26–36px with clear inset from the bar edges.
 * Mobile uses a shorter pill via --landing-nav-pill-h.
 */

export {
  LANDING_NAV_PILL_H,
  LANDING_NAV_PILL_RADIUS,
  LANDING_NAV_TOP,
} from "@/components/marketing/landing/nav-metrics";

const NAV_LINK_CLASS =
  "whitespace-nowrap text-[12px] font-medium text-[#1c133b] transition hover:text-[#312c79] xl:text-[13px]";

export function LandingNavbar({
  accountMenuItems,
  customerHref,
  headerExtra,
  loginHref: loginHrefProp,
  viewer: initialViewer = null,
}: {
  accountMenuItems?: AccountMenuItem[];
  customerHref: string;
  headerExtra?: React.ReactNode;
  loginHref?: string;
  viewer?: MarketingViewer;
}) {
  const configured = hasSupabasePublicConfig();
  const loginHref = loginHrefProp ?? (configured ? "/login" : "/setup");
  const [viewer, setViewer] = useState<MarketingViewer>(initialViewer);
  const accountHref = viewer ? dashboardForRole(viewer.role) : loginHref;
  const showForCleanersCta = viewer?.role !== "cleaner";
  const [mobileOpen, setMobileOpen] = useState(false);
  const hidden = useLandingNavScrollHide(mobileOpen);

  useEffect(() => {
    setViewer(initialViewer);
  }, [initialViewer]);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    async function loadViewer() {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setViewer(null);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name,avatar_url,role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profile && isUserRole(profile.role)) {
          setViewer(
            profile as Pick<Profile, "id" | "full_name" | "avatar_url" | "role">,
          );
          return;
        }

        setViewer(null);
      } catch {
        if (!cancelled) setViewer(null);
      }
    }

    void loadViewer();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  return (
    <header
      className={cn(
        "pointer-events-none sticky top-0 z-50 bg-transparent px-4 sm:px-8 lg:px-14 xl:px-20",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        hidden && "-translate-y-[calc(100%+0.75rem)]",
      )}
      style={{ paddingTop: LANDING_NAV_TOP }}
    >
      <div
        className={cn(
          "pointer-events-auto relative mx-auto flex w-full max-w-[1040px] -translate-y-0.5 items-center justify-between gap-3 shadow-[0_18px_48px_rgba(28,19,59,0.28)] sm:gap-6",
          hidden && "pointer-events-none",
        )}
        style={{
          backgroundColor: "#e8e0f9",
          borderRadius: LANDING_NAV_PILL_RADIUS,
          height: LANDING_NAV_PILL_H,
          paddingLeft: "1.25rem",
          paddingRight: "0.75rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
        }}
      >
        <LandingLogo className="h-5 min-[380px]:h-6 sm:h-8" href="/" priority />

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2"
        >
          {landingCategoryNav.map((menu) => (
            <CategoryNavDropdown
              customerHref={customerHref}
              key={menu.label}
              menu={menu}
            />
          ))}
          {landingNavLinks.map(([label, href]) =>
            href.startsWith("mailto:") ? (
              <a className={cn(NAV_LINK_CLASS, "px-2 py-1")} href={href} key={label}>
                {label}
              </a>
            ) : (
              <Link
                className={cn(NAV_LINK_CLASS, "px-2 py-1")}
                href={href}
                key={label}
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {headerExtra}
          {viewer ? <NotificationBell userId={viewer.id} /> : null}
          {viewer ? (
            <AccountMenu
              items={
                accountMenuItems ??
                (viewer.role === "cleaner"
                  ? CLEANER_ACCOUNT_MENU
                  : CUSTOMER_ACCOUNT_MENU)
              }
              profile={viewer}
            />
          ) : null}
          {showForCleanersCta ? (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#1c133b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#1c133b]/90"
              href="/for-cleaners"
            >
              For cleaners
            </Link>
          ) : null}
          {!viewer ? (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#c79c66] px-4 text-[12px] font-semibold text-[#1c133b] transition hover:bg-[#c79c66]/90"
              href={loginHref}
            >
              Log in
            </Link>
          ) : null}
        </div>

        <MobileNav
          accountHref={accountHref}
          customerHref={customerHref}
          loginHref={loginHref}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          showForCleanersCta={showForCleanersCta}
          viewer={viewer}
        />
      </div>
    </header>
  );
}

function categoryBookHref(customerHref: string, category: string) {
  if (!customerHref.startsWith("/booking")) return customerHref;
  return `/booking/new?category=${category}`;
}

function CategoryNavDropdown({
  customerHref,
  menu,
}: {
  customerHref: string;
  menu: (typeof landingCategoryNav)[number];
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          NAV_LINK_CLASS,
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5",
          open && "bg-white/55 text-[#312c79]",
        )}
        href={menu.href}
        onFocus={openMenu}
      >
        {menu.label}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 opacity-70 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Link>

      <div
        aria-hidden={!open}
        className={cn(
          "absolute left-1/2 top-full z-[60] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 pt-3 transition duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
        id={menuId}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        role="menu"
      >
        <div className="overflow-hidden rounded-2xl border border-[#1c133b]/08 bg-white shadow-[0_24px_60px_rgba(28,19,59,0.18)]">
          <div className="grid sm:grid-cols-[1.15fr_0.85fr]">
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                Services
              </p>
              <ul className="mt-3 grid gap-1">
                {menu.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="group flex flex-col rounded-xl px-3 py-2.5 transition hover:bg-[#f6f0ff]"
                      href={item.href}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      <span className="text-[13px] font-semibold text-[#1c133b] group-hover:text-[#312c79]">
                        {item.label}
                      </span>
                      <span className="text-[12px] font-normal text-[#1c133b]/60">
                        {item.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col border-t border-[#1c133b]/06 bg-[#f8f4ff] p-4 sm:border-l sm:border-t-0 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                {menu.label}
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-snug text-[#1c133b]">
                {menu.description}
              </p>
              <ul className="mt-4 space-y-2.5">
                {menu.notes.map((note) => (
                  <li
                    className="flex gap-2 text-[13px] leading-5 text-[#1c133b]/80"
                    key={note}
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#823fb2]"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2 border-t border-[#e4d8f5] pt-4">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#312c79] px-3 text-center text-[13px] font-semibold text-white transition hover:bg-[#241f5c]"
                  href={categoryBookHref(customerHref, menu.bookCategory)}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  {menu.bookLabel}
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white px-3 text-center text-[13px] font-semibold text-[#312c79] transition hover:bg-[#f3efe6]"
                  href={menu.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  {menu.pageLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNav({
  customerHref,
  loginHref,
  accountHref,
  viewer,
  mobileOpen,
  onMobileOpenChange,
  showForCleanersCta,
}: {
  customerHref: string;
  loginHref: string;
  accountHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  showForCleanersCta: boolean;
}) {
  const [panel, setPanel] = useState<"main" | string>("main");
  const panelRef = useRef<HTMLDivElement>(null);
  const activeCategory =
    panel === "main"
      ? null
      : (landingCategoryNav.find((menu) => menu.label === panel) ?? null);

  useEffect(() => {
    if (!mobileOpen) {
      setPanel("main");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (panel !== "main") {
          setPanel("main");
          return;
        }
        onMobileOpenChange(false);
      }
    }

    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, onMobileOpenChange, panel]);

  function closeMenu() {
    onMobileOpenChange(false);
  }

  return (
    <div className="flex items-center gap-1.5 lg:hidden">
      {viewer ? <NotificationBell userId={viewer.id} /> : null}
      {viewer ? (
        <Link
          aria-label={`Open account for ${viewer.full_name}`}
          className="shrink-0"
          href={accountHref}
        >
          <UserAvatar
            name={viewer.full_name}
            seed={viewer.id}
            size="sm"
            url={viewer.avatar_url}
          />
        </Link>
      ) : null}
      {!viewer ? (
        <Link
          className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#c79c66] px-2.5 text-[11px] font-semibold text-[#1c133b] transition hover:bg-[#c79c66]/90 touch-manipulation min-[380px]:px-3.5 min-[380px]:text-[12px]"
          href={loginHref}
        >
          Log in
        </Link>
      ) : null}
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#1c133b] touch-manipulation"
        onClick={() => onMobileOpenChange(!mobileOpen)}
        type="button"
      >
        {mobileOpen ? (
          <X className="size-4" strokeWidth={2.25} />
        ) : (
          <Menu className="size-4" strokeWidth={2.25} />
        )}
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[#1c133b]/45"
            onClick={closeMenu}
            type="button"
          />
          <div
            className="absolute inset-x-0 bottom-0 top-[calc(var(--landing-nav-pill-h)+max(1.1rem,env(safe-area-inset-top,0px)+0.35rem))] flex outline-none sm:inset-x-6 sm:bottom-6 sm:top-[calc(var(--landing-nav-pill-h)+max(1.25rem,env(safe-area-inset-top,0px)+0.5rem)+0.35rem)]"
            ref={panelRef}
            tabIndex={-1}
          >
            <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-[0_-12px_48px_rgba(28,19,59,0.2)] sm:rounded-[1.5rem] sm:shadow-[0_24px_60px_rgba(28,19,59,0.22)]">
              <div
                className={cn(
                  "flex h-full w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none",
                  activeCategory ? "-translate-x-1/2" : "translate-x-0",
                )}
              >
                {/* Main services panel */}
                <nav
                  aria-hidden={Boolean(activeCategory)}
                  aria-label="Mobile navigation"
                  className="flex h-full w-1/2 flex-col overflow-y-auto overscroll-contain"
                >
                  <div className="border-b border-[#1c133b]/08 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#823fb2]">
                      Services
                    </p>
                  </div>
                  <ul className="flex-1">
                    {landingCategoryNav.map((menu) => (
                      <li
                        className="border-b border-[#1c133b]/06"
                        key={menu.label}
                      >
                        <button
                          className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3.5 text-left touch-manipulation"
                          onClick={() => setPanel(menu.label)}
                          type="button"
                        >
                          <span>
                            <span className="block text-[15px] font-semibold text-[#1c133b]">
                              {menu.label}
                            </span>
                            <span className="mt-0.5 block text-[12px] font-normal text-[#1c133b]/55">
                              {menu.description}
                            </span>
                          </span>
                          <ChevronRight
                            aria-hidden
                            className="size-5 shrink-0 text-[#1c133b]/45"
                          />
                        </button>
                      </li>
                    ))}
                    {landingNavLinks.map(([label, href]) => (
                      <li
                        className="border-b border-[#1c133b]/06"
                        key={label}
                      >
                        {href.startsWith("mailto:") ? (
                          <a
                            className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                            href={href}
                            onClick={closeMenu}
                          >
                            {label}
                          </a>
                        ) : (
                          <Link
                            className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                            href={href}
                            onClick={closeMenu}
                          >
                            {label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto grid gap-2 border-t border-[#1c133b]/08 bg-[#f8f4ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {viewer ? (
                      <Button
                        asChild
                        className="h-11 rounded-full text-sm font-semibold"
                        variant="outline"
                      >
                        <Link href={accountHref} onClick={closeMenu}>
                          Dashboard
                        </Link>
                      </Button>
                    ) : null}
                    {showForCleanersCta ? (
                      <Button
                        asChild
                        className="h-11 rounded-full bg-[#1c133b] text-sm font-semibold text-white hover:bg-[#1c133b]/90"
                      >
                        <Link href="/for-cleaners" onClick={closeMenu}>
                          For cleaners
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </nav>

                {/* Category drill-down panel */}
                <nav
                  aria-hidden={!activeCategory}
                  aria-label={
                    activeCategory
                      ? `${activeCategory.label} services`
                      : "Category services"
                  }
                  className="flex h-full w-1/2 flex-col overflow-y-auto overscroll-contain"
                >
                  {activeCategory ? (
                    <>
                      <div className="sticky top-0 z-10 border-b border-[#1c133b]/08 bg-white px-2 py-2">
                        <button
                          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#1c133b] touch-manipulation"
                          onClick={() => setPanel("main")}
                          type="button"
                        >
                          <ChevronLeft aria-hidden className="size-5" />
                          Back
                        </button>
                      </div>
                      <div className="px-5 pb-3 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#823fb2]">
                          {activeCategory.label}
                        </p>
                        <p className="mt-2 text-[15px] font-semibold leading-snug text-[#1c133b]">
                          {activeCategory.description}
                        </p>
                        <Link
                          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#312c79] px-3 text-sm font-semibold text-white touch-manipulation"
                          href={categoryBookHref(
                            customerHref,
                            activeCategory.bookCategory,
                          )}
                          onClick={closeMenu}
                        >
                          {activeCategory.bookLabel}
                        </Link>
                      </div>
                      <div className="px-5 pb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                          Services
                        </p>
                      </div>
                      <ul className="flex-1 pb-2">
                        {activeCategory.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              className="block border-b border-[#1c133b]/06 px-5 py-3.5 touch-manipulation"
                              href={item.href}
                              onClick={closeMenu}
                            >
                              <span className="block text-[15px] font-semibold text-[#1c133b]">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block text-[12px] font-normal text-[#1c133b]/55">
                                {item.description}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto border-t border-[#1c133b]/08 bg-[#f8f4ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <Link
                          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-[#312c79] ring-1 ring-[#1c133b]/10 touch-manipulation"
                          href={activeCategory.href}
                          onClick={closeMenu}
                        >
                          {activeCategory.pageLabel}
                        </Link>
                      </div>
                    </>
                  ) : null}
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
