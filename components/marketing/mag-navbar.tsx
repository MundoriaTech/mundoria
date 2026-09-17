"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  LANDING_NAV_PILL_H,
  LANDING_NAV_PILL_RADIUS,
  LANDING_NAV_TOP,
} from "@/components/marketing/landing/nav-metrics";
import { useLandingNavScrollHide } from "@/components/marketing/landing/use-nav-scroll-hide";
import { magThemeFor } from "@/lib/content/mag-theme";
import { cn } from "@/lib/utils";

export type MagNavCategory = {
  href: string;
  label: string;
  posts: Array<{ href: string; title: string }>;
};

const NAV_LINK_CLASS =
  "whitespace-nowrap text-[12px] font-medium text-[#1c133b] transition hover:text-[#312c79] xl:text-[13px]";

function TopicsMegaMenu({ categories }: { categories: MagNavCategory[] }) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          NAV_LINK_CLASS,
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5",
          open && "bg-white/55 text-[#312c79]",
        )}
        onClick={() => setOpen((value) => !value)}
        onFocus={openMenu}
        type="button"
      >
        Topics
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 opacity-70 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4694a]">
                Browse Mag
              </p>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {categories.map((category) => {
                  const theme = magThemeFor(category.label);
                  return (
                    <li key={category.href}>
                      <Link
                        className="group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-[#fff8f2]"
                        href={category.href}
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[#1c133b] group-hover:text-[#312c79]">
                            {category.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[#5a5470]">
                            {category.posts.length
                              ? "Open section"
                              : "View section"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-[#eadfce]/80 bg-[#fff8f2] p-4 sm:border-l sm:border-t-0 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                Fresh reads
              </p>
              <ul className="mt-3 space-y-1">
                {categories
                  .flatMap((category) =>
                    category.posts.slice(0, 1).map((post) => ({
                      ...post,
                      category: category.label,
                    })),
                  )
                  .slice(0, 4)
                  .map((post) => (
                    <li key={post.href}>
                      <Link
                        className="block rounded-xl px-2.5 py-2 transition hover:bg-white"
                        href={post.href}
                        onClick={() => setOpen(false)}
                        role="menuitem"
                      >
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d4694a]">
                          {post.category}
                        </span>
                        <span className="mt-0.5 block text-[13px] font-medium leading-5 text-[#1c133b] line-clamp-2">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
              <Link
                className="mt-3 inline-flex text-[12px] font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                href="/blog"
                onClick={() => setOpen(false)}
              >
                All stories →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MagNavbar({
  bookingHref,
  categories,
}: {
  bookingHref: string;
  categories: MagNavCategory[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hidden = useLandingNavScrollHide(mobileOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

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
          "pointer-events-auto relative mx-auto flex w-full max-w-[1040px] -translate-y-0.5 items-center justify-between gap-3 shadow-[0_18px_48px_rgba(28,19,59,0.28)] sm:gap-5",
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
        <Link
          aria-label="Mundoria Mag home"
          className="shrink-0 text-[1.05rem] font-black tracking-[-0.06em] text-[#1c133b] sm:text-[1.3rem]"
          href="/blog"
        >
          Mundoria <span className="text-[#d4694a]">Mag</span>
        </Link>

        <nav
          aria-label="Magazine"
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
        >
          <TopicsMegaMenu categories={categories} />
          <Link className={cn(NAV_LINK_CLASS, "px-2.5 py-1.5")} href="/blog">
            All stories
          </Link>
          <Link className={cn(NAV_LINK_CLASS, "px-2.5 py-1.5")} href="/help">
            Help
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            className="hidden rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#1c133b] transition hover:bg-white/55 sm:inline"
            href="/"
          >
            mundoriauk.com
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#1c133b] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#1c133b]/90 sm:px-4"
            href={bookingHref}
          >
            Book a clean
          </Link>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#1c133b] touch-manipulation lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? (
              <X className="size-4" strokeWidth={2.25} />
            ) : (
              <Menu className="size-4" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div
            className="absolute inset-x-4 top-[calc(var(--landing-nav-pill-h)+max(1.25rem,env(safe-area-inset-top,0px)+0.5rem)+0.35rem)] max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[#1c133b]/08 bg-white p-4 shadow-[0_24px_60px_rgba(28,19,59,0.22)] outline-none sm:inset-x-8"
            ref={panelRef}
            tabIndex={-1}
          >
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4694a]">
              Topics
            </p>
            <ul className="mt-2 grid gap-1">
              {categories.map((category) => {
                const theme = magThemeFor(category.label);
                return (
                  <li key={category.href}>
                    <Link
                      className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-semibold text-[#1c133b] touch-manipulation"
                      href={category.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                      {category.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-[#eadfce]/80 pt-2">
              <Link
                className="flex min-h-11 items-center px-2 text-sm font-semibold text-[#6a45b8] touch-manipulation"
                href="/blog"
                onClick={() => setMobileOpen(false)}
              >
                All stories
              </Link>
              <Link
                className="flex min-h-11 items-center px-2 text-sm font-semibold text-[#6a45b8] touch-manipulation"
                href="/help"
                onClick={() => setMobileOpen(false)}
              >
                Help Centre
              </Link>
              <Link
                className="flex min-h-11 items-center px-2 text-sm font-semibold text-[#6a45b8] touch-manipulation"
                href="/"
                onClick={() => setMobileOpen(false)}
              >
                mundoriauk.com
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
