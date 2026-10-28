"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { landingCategoryNav } from "@/components/marketing/landing/constants";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { magThemeFor } from "@/lib/content/mag-theme";
import type { FaqNavMenu } from "@/lib/seo/site-faqs";
import { cn } from "@/lib/utils";

export type MagMobileTopic = {
  href: string;
  label: string;
};

type Panel = "main" | "mag" | `cat:${string}` | `faq:${string}`;

function categoryBookHref(customerHref: string, category: string) {
  if (!customerHref.startsWith("/booking")) return customerHref;
  return `/booking/new?category=${category}`;
}

const LINK_CLASS =
  "block py-3 text-[15px] font-normal text-brand-ink underline decoration-brand-ink/25 underline-offset-[5px] touch-manipulation";

const ROW_CLASS =
  "flex min-h-12 w-full items-center justify-between gap-3 py-3 text-left text-[15px] font-normal text-brand-ink touch-manipulation";

/** WeCasa-style left off-canvas drawer: Services → My account → About us. */
export function MarketingMobileMenuSheet({
  customerHref,
  faqNav,
  loginHref = "/login",
  magTopics,
  mobileOpen,
  onClose,
  showForCleanersCta = true,
  accountHref,
  viewerDashboard,
  variant = "marketing",
}: {
  accountHref?: string;
  customerHref: string;
  faqNav?: FaqNavMenu[];
  loginHref?: string;
  magTopics?: MagMobileTopic[];
  mobileOpen: boolean;
  onClose: () => void;
  showForCleanersCta?: boolean;
  variant?: "marketing" | "mag" | "faq";
  viewerDashboard?: boolean;
}) {
  const [panel, setPanel] = useState<Panel>("main");
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeCategory =
    panel.startsWith("cat:")
      ? (landingCategoryNav.find(
          (menu) => menu.label === panel.slice(4),
        ) ?? null)
      : null;
  const activeFaqSection =
    panel.startsWith("faq:") && faqNav
      ? (faqNav.find((menu) => menu.id === panel.slice(4)) ?? null)
      : null;
  const hasMagTopics = Boolean(magTopics?.length);
  const onDrill =
    panel !== "main"
      ? () => {
          if (
            panel.startsWith("cat:") ||
            panel.startsWith("faq:") ||
            panel === "mag"
          ) {
            setPanel("main");
          }
        }
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mobileOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-brand-ink/40"
        onClick={onClose}
        type="button"
      />
      <div
        className="absolute inset-y-0 left-0 flex w-[min(20.5rem,86vw)] outline-none"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-[12px_0_40px_rgba(28,19,59,0.18)]">
          <div
            className={cn(
              "flex h-full w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none",
            )}
            style={{
              transform:
                panel === "main" ? "translateX(0%)" : "translateX(-50%)",
            }}
          >
            {/* Main — WeCasa sections */}
            <nav
              aria-hidden={panel !== "main"}
              aria-label="Mobile navigation"
              className="flex h-full w-1/2 flex-col overflow-y-auto overscroll-contain px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
            >
              <div className="mb-5 pt-1">
                {variant === "mag" ? (
                  <Link
                    aria-label="Mundoria Mag home"
                    className="inline-block text-[1.15rem] font-black tracking-[-0.06em] text-brand-ink"
                    href="/blog"
                    onClick={onClose}
                  >
                    Mundoria <span className="text-brand-terracotta">Mag</span>
                  </Link>
                ) : (
                  <LandingLogo className="h-7 w-auto" href="/" />
                )}
              </div>

              {variant === "mag" ? (
                <section className="pb-6">
                  <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                    Mag
                  </h2>
                  <ul className="mt-1">
                    {hasMagTopics ? (
                      <li>
                        <button
                          className={ROW_CLASS}
                          onClick={() => setPanel("mag")}
                          type="button"
                        >
                          <span>Topics</span>
                          <ChevronRight
                            aria-hidden
                            className="size-4 shrink-0 text-[#5b6cff]"
                            strokeWidth={2.25}
                          />
                        </button>
                      </li>
                    ) : null}
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/blog"
                        onClick={onClose}
                      >
                        All stories
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/help"
                        onClick={onClose}
                      >
                        Help
                      </Link>
                    </li>
                    <li>
                      <Link className={LINK_CLASS} href="/" onClick={onClose}>
                        Home
                      </Link>
                    </li>
                  </ul>
                </section>
              ) : variant === "faq" && faqNav?.length ? (
                <section className="pb-6">
                  <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                    FAQ topics
                  </h2>
                  <ul className="mt-1">
                    {faqNav.map((menu) => (
                      <li key={menu.id}>
                        <button
                          className={ROW_CLASS}
                          onClick={() => setPanel(`faq:${menu.id}`)}
                          type="button"
                        >
                          <span>{menu.label}</span>
                          <ChevronRight
                            aria-hidden
                            className="size-4 shrink-0 text-[#5b6cff]"
                            strokeWidth={2.25}
                          />
                        </button>
                      </li>
                    ))}
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/help"
                        onClick={onClose}
                      >
                        Help Centre
                      </Link>
                    </li>
                  </ul>
                </section>
              ) : (
                <section className="pb-6">
                  <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                    Services
                  </h2>
                  <ul className="mt-1">
                    {landingCategoryNav.map((menu) => (
                      <li key={menu.label}>
                        <button
                          className={ROW_CLASS}
                          onClick={() => setPanel(`cat:${menu.label}`)}
                          type="button"
                        >
                          <span>{menu.label}</span>
                          <ChevronRight
                            aria-hidden
                            className="size-4 shrink-0 text-[#5b6cff]"
                            strokeWidth={2.25}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="pb-6">
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                  My account
                </h2>
                <ul className="mt-1">
                  <li>
                    {viewerDashboard && accountHref ? (
                      <Link
                        className={LINK_CLASS}
                        href={accountHref}
                        onClick={onClose}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <Link
                        className={LINK_CLASS}
                        href={loginHref}
                        onClick={onClose}
                      >
                        Sign in
                      </Link>
                    )}
                  </li>
                </ul>
              </section>

              {variant === "marketing" ? (
                <section>
                  <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                    About us
                  </h2>
                  <ul className="mt-1">
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/contact"
                        onClick={onClose}
                      >
                        Contact us
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/help"
                        onClick={onClose}
                      >
                        Help centre
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={LINK_CLASS}
                        href="/blog"
                        onClick={onClose}
                      >
                        Mundoria Mag
                      </Link>
                    </li>
                    {showForCleanersCta ? (
                      <li>
                        <Link
                          className={LINK_CLASS}
                          href="/for-cleaners"
                          onClick={onClose}
                        >
                          Become a cleaner
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </section>
              ) : null}
            </nav>

            {/* Drill-down */}
            <nav
              aria-hidden={panel === "main"}
              aria-label={
                panel === "mag"
                  ? "Mag topics"
                  : activeFaqSection
                    ? activeFaqSection.label
                    : activeCategory
                      ? `${activeCategory.label} services`
                      : "Services"
              }
              className="flex h-full w-1/2 flex-col overflow-y-auto overscroll-contain pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
            >
              <div className="sticky top-0 z-10 bg-white px-3 py-2">
                <button
                  className="inline-flex min-h-11 items-center gap-1 px-2 text-[15px] font-semibold text-brand-ink touch-manipulation"
                  onClick={() => onDrill?.()}
                  type="button"
                >
                  <ChevronLeft aria-hidden className="size-5" />
                  Back
                </button>
              </div>

              {panel === "mag" && magTopics ? (
                <>
                  <div className="px-6 pb-2">
                    <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                      Mag topics
                    </h2>
                  </div>
                  <ul className="flex-1 px-6">
                    {magTopics.map((topic) => {
                      const theme = magThemeFor(topic.label);
                      return (
                        <li key={topic.href}>
                          <Link
                            className="flex min-h-12 items-center gap-3 py-3 touch-manipulation"
                            href={topic.href}
                            onClick={onClose}
                          >
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span className="text-[15px] text-brand-ink">
                              {topic.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto px-6 pt-4">
                    <Link
                      className={LINK_CLASS}
                      href="/blog"
                      onClick={onClose}
                    >
                      All stories
                    </Link>
                  </div>
                </>
              ) : activeFaqSection ? (
                <>
                  <div className="px-6 pb-3">
                    <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                      {activeFaqSection.label}
                    </h2>
                    <p className="mt-1 text-[13px] leading-5 text-brand-ink/55">
                      {activeFaqSection.description}
                    </p>
                  </div>
                  <ul className="flex-1 px-6">
                    {activeFaqSection.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          className="block border-b border-brand-ink/08 py-3.5 text-[15px] font-medium leading-snug text-brand-ink touch-manipulation"
                          href={item.href}
                          onClick={onClose}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto px-6 pt-4">
                    <Link
                      className={LINK_CLASS}
                      href={activeFaqSection.href}
                      onClick={onClose}
                    >
                      View all in this section
                    </Link>
                  </div>
                </>
              ) : activeCategory ? (
                <>
                  <div className="px-6 pb-3">
                    <h2 className="text-[17px] font-bold tracking-[-0.02em] text-brand-ink">
                      {activeCategory.label}
                    </h2>
                    <p className="mt-1 text-[13px] leading-5 text-brand-ink/55">
                      {activeCategory.description}
                    </p>
                    <Link
                      className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-ink px-3 text-sm font-semibold text-white touch-manipulation"
                      href={categoryBookHref(
                        customerHref,
                        activeCategory.bookCategory,
                      )}
                      onClick={onClose}
                    >
                      {activeCategory.bookLabel}
                    </Link>
                  </div>
                  <ul className="flex-1 px-6">
                    {activeCategory.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          className="block border-b border-brand-ink/08 py-3.5 touch-manipulation"
                          href={item.href}
                          onClick={onClose}
                        >
                          <span className="block text-[15px] font-medium text-brand-ink">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-[12px] font-normal text-brand-ink/55">
                            {item.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto px-6 pt-4">
                    <Link
                      className={LINK_CLASS}
                      href={activeCategory.href}
                      onClick={onClose}
                    >
                      {activeCategory.pageLabel}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-6 text-sm text-brand-ink/50">
                  Choose a category
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
