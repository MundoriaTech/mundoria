"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  landingColors,
  landingNavLinks,
  landingServicesMenu,
} from "@/components/marketing/landing/constants";
import { dashboardForRole } from "@/lib/auth/redirects";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";

/**
 * Measured from Frame 105 (1024×92 export):
 * bar ~75px tall, corner radius ~18px (gently curved sides, not stadium),
 * lavender #e8e0f9, CTA pills ~26–36px with clear inset from the bar edges.
 */
export const LANDING_NAV_TOP =
  "max(1.25rem, env(safe-area-inset-top, 0px) + 0.5rem)";
export const LANDING_NAV_PILL_H = "4.75rem"; /* ~76px — room for inner pad + CTA pills */
export const LANDING_NAV_PILL_RADIUS = "1.125rem"; /* 18px */

const NAV_LINK_CLASS =
  "whitespace-nowrap text-[12px] font-medium text-[#1c133b] transition hover:text-[#312c79] xl:text-[13px]";

export function LandingNavbar({
  customerHref,
  viewer,
}: {
  customerHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  const configured = hasSupabasePublicConfig();
  const loginHref = configured ? "/login" : "/setup";
  const accountHref = viewer ? dashboardForRole(viewer.role) : loginHref;
  const firstName = viewer?.full_name.trim().split(/\s+/)[0] ?? "";

  return (
    <header
      className="pointer-events-none sticky top-0 z-50 bg-transparent px-5 sm:px-8 lg:px-14 xl:px-20"
      style={{ paddingTop: LANDING_NAV_TOP }}
    >
      <div
        className="pointer-events-auto relative mx-auto flex w-full max-w-[1040px] items-center justify-between gap-5 sm:gap-6"
        style={{
          backgroundColor: "#e8e0f9",
          borderRadius: LANDING_NAV_PILL_RADIUS,
          height: LANDING_NAV_PILL_H,
          paddingLeft: "1.75rem",
          paddingRight: "1rem",
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
        }}
      >
        <LandingLogo className="h-7 sm:h-8" href="/" priority />

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2"
        >
          {landingNavLinks.map(([label, href]) =>
            label === "Services" ? (
              <ServicesNavDropdown key={label} />
            ) : href.startsWith("mailto:") ? (
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
          {viewer ? (
            <Link
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-black/5"
              href={accountHref}
            >
              <UserAvatar
                name={viewer.full_name}
                seed={viewer.id}
                size="sm"
                url={viewer.avatar_url}
              />
              <span className="max-w-[8rem] truncate text-sm font-semibold text-[#1c133b]">
                {firstName}
              </span>
            </Link>
          ) : (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full px-4 text-[12px] font-semibold text-[#1c133b] transition hover:brightness-95"
              href={loginHref}
              style={{ backgroundColor: landingColors.peach }}
            >
              Log in
            </Link>
          )}
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#1c133b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#1c133b]/90"
            href={customerHref}
          >
            Book a clean
          </Link>
        </div>

        <MobileNav
          accountHref={accountHref}
          customerHref={customerHref}
          loginHref={loginHref}
          viewer={viewer}
        />
      </div>
    </header>
  );
}

/** WeCasa-style hover panel for Services. */
function ServicesNavDropdown() {
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
        href="/cleaning"
        onFocus={openMenu}
      >
        Services
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
          <div className="grid gap-0 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                Categories
              </p>
              <ul className="mt-3 grid gap-1">
                {landingServicesMenu.categories.map((item) => (
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

            <div className="border-t border-[#1c133b]/06 bg-[#f8f4ff] p-4 sm:border-l sm:border-t-0 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                Popular
              </p>
              <ul className="mt-3 grid gap-0.5">
                {landingServicesMenu.popular.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="block rounded-lg px-3 py-2 text-[13px] font-medium text-[#1c133b] transition hover:bg-white hover:text-[#312c79]"
                      href={item.href}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                className="mt-4 inline-flex text-[12px] font-semibold text-[#312c79] underline-offset-2 hover:underline"
                href="/cleaning"
                onClick={() => setOpen(false)}
              >
                View all services
              </Link>
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
}: {
  customerHref: string;
  loginHref: string;
  accountHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  return (
    <div className="flex items-center gap-2 lg:hidden">
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
      <details className="relative">
        <summary className="flex h-9 cursor-pointer list-none items-center rounded-full border border-[#1c133b]/12 bg-white/70 px-4 text-sm font-semibold text-[#1c133b] [&::-webkit-details-marker]:hidden">
          Menu
        </summary>
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-2xl">
          <nav
            aria-label="Mobile navigation"
            className="grid divide-y divide-border"
          >
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                Services
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <div className="bg-[#f8f4ff] pb-2">
                {landingServicesMenu.categories.map((item) => (
                  <Link
                    className="block px-5 py-2.5 text-sm font-medium text-[#1c133b] hover:bg-white/70"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  className="block px-5 py-2.5 text-sm font-semibold text-[#312c79]"
                  href="/cleaning"
                >
                  All services
                </Link>
              </div>
            </details>
            {landingNavLinks
              .filter(([label]) => label !== "Services")
              .map(([label, href]) =>
                href.startsWith("mailto:") ? (
                  <a
                    className="px-5 py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                    href={href}
                    key={label}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    className="px-5 py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                    href={href}
                    key={label}
                  >
                    {label}
                  </Link>
                ),
              )}
          </nav>
          <div className="grid gap-2 bg-[#f6f0ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              asChild
              className="h-11 rounded-full bg-[#1c133b] text-sm font-semibold text-white hover:bg-[#1c133b]/90"
            >
              <Link href={customerHref}>Book a clean</Link>
            </Button>
            {viewer ? (
              <Button
                asChild
                className="h-11 rounded-full text-sm font-semibold"
                variant="outline"
              >
                <Link href={accountHref}>Dashboard</Link>
              </Button>
            ) : (
              <Button
                asChild
                className="h-11 rounded-full text-sm font-semibold text-[#1c133b] hover:brightness-95"
                style={{ backgroundColor: landingColors.peach }}
              >
                <Link href={loginHref}>Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
