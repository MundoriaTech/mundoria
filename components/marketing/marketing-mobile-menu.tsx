"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { landingCategoryNav } from "@/components/marketing/landing/constants";
import { Button } from "@/components/ui/button";
import { magThemeFor } from "@/lib/content/mag-theme";

export type MagMobileTopic = {
  href: string;
  label: string;
};

type Panel = "main" | "cleaning" | "mag" | `cat:${string}`;

function categoryBookHref(customerHref: string, category: string) {
  if (!customerHref.startsWith("/booking")) return customerHref;
  return `/booking/new?category=${category}`;
}

function panelIndex(panel: Panel) {
  if (panel === "main") return 0;
  if (panel.startsWith("cat:")) return 2;
  return 1;
}

/** WeCasa-style multi-panel mobile menu: verticals → hub → services. */
export function MarketingMobileMenuSheet({
  customerHref,
  magTopics,
  mobileOpen,
  onClose,
  showForCleanersCta,
  accountHref,
  viewerDashboard,
  variant = "marketing",
}: {
  accountHref?: string;
  customerHref: string;
  magTopics?: MagMobileTopic[];
  mobileOpen: boolean;
  onClose: () => void;
  showForCleanersCta?: boolean;
  variant?: "marketing" | "mag";
  viewerDashboard?: boolean;
}) {
  const [panel, setPanel] = useState<Panel>("main");
  const panelRef = useRef<HTMLDivElement>(null);
  const depth = panelIndex(panel);
  const activeCategory =
    panel.startsWith("cat:")
      ? (landingCategoryNav.find(
          (menu) => menu.label === panel.slice(4),
        ) ?? null)
      : null;
  const hasMagTopics = Boolean(magTopics?.length);

  useEffect(() => {
    if (!mobileOpen) {
      setPanel("main");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (panel.startsWith("cat:")) {
        setPanel("cleaning");
        return;
      }
      if (panel !== "main") {
        setPanel("main");
        return;
      }
      onClose();
    }

    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, onClose, panel]);

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-[#1c133b]/45"
        onClick={onClose}
        type="button"
      />
      <div
        className="absolute inset-x-0 bottom-0 top-[calc(var(--landing-nav-pill-h)+max(1.1rem,env(safe-area-inset-top,0px)+0.35rem))] flex outline-none sm:inset-x-6 sm:bottom-6 sm:top-[calc(var(--landing-nav-pill-h)+max(1.25rem,env(safe-area-inset-top,0px)+0.5rem)+0.35rem)]"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-[0_-12px_48px_rgba(28,19,59,0.2)] sm:rounded-[1.5rem] sm:shadow-[0_24px_60px_rgba(28,19,59,0.22)]">
          <div
            className="flex h-full w-[300%] transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${(depth * 100) / 3}%)` }}
          >
            {/* Main — verticals */}
            <nav
              aria-hidden={depth !== 0}
              aria-label="Mobile navigation"
              className="flex h-full w-1/3 flex-col overflow-y-auto overscroll-contain"
            >
              <div className="border-b border-[#1c133b]/08 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#823fb2]">
                  Services
                </p>
              </div>
              <ul className="flex-1">
                <li className="border-b border-[#1c133b]/06">
                  <button
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3.5 text-left touch-manipulation"
                    onClick={() => setPanel("cleaning")}
                    type="button"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-[#1c133b]">
                        Cleaning
                      </span>
                      <span className="mt-0.5 block text-[12px] font-normal text-[#1c133b]/55">
                        Homes, workplaces and recovery support
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="size-5 shrink-0 text-[#1c133b]/45"
                    />
                  </button>
                </li>
                {hasMagTopics ? (
                  <li className="border-b border-[#1c133b]/06">
                    <button
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3.5 text-left touch-manipulation"
                      onClick={() => setPanel("mag")}
                      type="button"
                    >
                      <span>
                        <span className="block text-[15px] font-semibold text-[#1c133b]">
                          Mag
                        </span>
                        <span className="mt-0.5 block text-[12px] font-normal text-[#1c133b]/55">
                          Guides, tips and stories
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden
                        className="size-5 shrink-0 text-[#1c133b]/45"
                      />
                    </button>
                  </li>
                ) : (
                  <li className="border-b border-[#1c133b]/06">
                    <Link
                      className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                      href="/blog"
                      onClick={onClose}
                    >
                      Mag
                    </Link>
                  </li>
                )}
                {variant === "mag" ? (
                  <>
                    <li className="border-b border-[#1c133b]/06">
                      <Link
                        className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                        href="/blog"
                        onClick={onClose}
                      >
                        All stories
                      </Link>
                    </li>
                    <li className="border-b border-[#1c133b]/06">
                      <Link
                        className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                        href="/help"
                        onClick={onClose}
                      >
                        Help
                      </Link>
                    </li>
                    <li className="border-b border-[#1c133b]/06">
                      <Link
                        className="flex min-h-14 items-center px-5 py-3.5 text-[15px] font-semibold text-[#1c133b] touch-manipulation"
                        href="/"
                        onClick={onClose}
                      >
                        Home
                      </Link>
                    </li>
                  </>
                ) : null}
              </ul>
              <div className="mt-auto grid gap-2 border-t border-[#1c133b]/08 bg-[#f8f4ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {viewerDashboard && accountHref ? (
                  <Button
                    asChild
                    className="h-11 rounded-full text-sm font-semibold"
                    variant="outline"
                  >
                    <Link href={accountHref} onClick={onClose}>
                      Dashboard
                    </Link>
                  </Button>
                ) : null}
                {showForCleanersCta ? (
                  <Button
                    asChild
                    className="h-11 rounded-full bg-[#1c133b] text-sm font-semibold text-white hover:bg-[#1c133b]/90"
                  >
                    <Link href="/for-cleaners" onClick={onClose}>
                      For cleaners
                    </Link>
                  </Button>
                ) : null}
              </div>
            </nav>

            {/* Hub — Cleaning or Mag topics */}
            <nav
              aria-hidden={depth !== 1}
              aria-label={panel === "mag" ? "Mag topics" : "Cleaning"}
              className="flex h-full w-1/3 flex-col overflow-y-auto overscroll-contain"
            >
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

              {panel === "mag" && magTopics ? (
                <>
                  <div className="px-5 pb-2 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4694a]">
                      Mag
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[#1c133b]">
                      Browse topics
                    </p>
                  </div>
                  <ul className="flex-1 pb-2">
                    {magTopics.map((topic) => {
                      const theme = magThemeFor(topic.label);
                      return (
                        <li key={topic.href}>
                          <Link
                            className="flex min-h-14 items-center gap-3 border-b border-[#1c133b]/06 px-5 py-3.5 touch-manipulation"
                            href={topic.href}
                            onClick={onClose}
                          >
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span className="text-[15px] font-semibold text-[#1c133b]">
                              {topic.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto border-t border-[#1c133b]/08 bg-[#f8f4ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Link
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-[#312c79] ring-1 ring-[#1c133b]/10 touch-manipulation"
                      href="/blog"
                      onClick={onClose}
                    >
                      All stories
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pb-3 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#823fb2]">
                      Cleaning
                    </p>
                    <p className="mt-2 text-[15px] font-semibold leading-snug text-[#1c133b]">
                      Domestic cleaning near you
                    </p>
                    <Link
                      className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#312c79] px-3 text-sm font-semibold text-white touch-manipulation"
                      href={
                        customerHref.startsWith("/booking")
                          ? "/booking/new"
                          : customerHref
                      }
                      onClick={onClose}
                    >
                      Book my cleaning
                    </Link>
                    <p className="mt-2 text-center text-[12px] font-medium text-[#1c133b]/50">
                      Free quote — no commitment
                    </p>
                  </div>
                  <div className="px-5 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
                      Categories
                    </p>
                  </div>
                  <ul className="flex-1 pb-2">
                    {landingCategoryNav.map((menu) => (
                      <li key={menu.label}>
                        <button
                          className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-[#1c133b]/06 px-5 py-3.5 text-left touch-manipulation"
                          onClick={() => setPanel(`cat:${menu.label}`)}
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
                  </ul>
                  <div className="mt-auto border-t border-[#1c133b]/08 bg-[#f8f4ff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Link
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-[#312c79] ring-1 ring-[#1c133b]/10 touch-manipulation"
                      href="/cleaning"
                      onClick={onClose}
                    >
                      See cleaning services
                    </Link>
                  </div>
                </>
              )}
            </nav>

            {/* Category services */}
            <nav
              aria-hidden={depth !== 2}
              aria-label={
                activeCategory
                  ? `${activeCategory.label} services`
                  : "Category services"
              }
              className="flex h-full w-1/3 flex-col overflow-y-auto overscroll-contain"
            >
              {activeCategory ? (
                <>
                  <div className="sticky top-0 z-10 border-b border-[#1c133b]/08 bg-white px-2 py-2">
                    <button
                      className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#1c133b] touch-manipulation"
                      onClick={() => setPanel("cleaning")}
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
                      onClick={onClose}
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
                          onClick={onClose}
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
                      onClick={onClose}
                    >
                      {activeCategory.pageLabel}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-5 text-sm text-[#1c133b]/50">
                  Choose a category
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
