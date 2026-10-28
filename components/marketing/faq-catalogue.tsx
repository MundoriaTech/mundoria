"use client";

import { ArrowDown, ArrowUp, ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { FAQ_NAV_GROUPS } from "@/lib/seo/site-faq-catalogue";
import {
  faqItemAnchor,
  SITE_FAQ_SECTIONS,
  type SiteFaqSection,
} from "@/lib/seo/site-faqs";
import {
  softScrollToBottom,
  softScrollToTop,
} from "@/lib/soft-scroll-to-top";

function filterSections(query: string): SiteFaqSection[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SITE_FAQ_SECTIONS;

  const terms = normalized.split(/\s+/).filter(Boolean);

  return SITE_FAQ_SECTIONS.map((section) => {
    const items = section.items.filter((item) => {
      const haystack = `${item.question} ${item.answer}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    return { ...section, items };
  }).filter((section) => section.items.length > 0);
}

function groupSections(sections: SiteFaqSection[]) {
  const byId = new Map(sections.map((section) => [section.id, section]));

  return FAQ_NAV_GROUPS.map((group) => ({
    description: group.description,
    id: group.id,
    label: group.label,
    sections: group.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is SiteFaqSection => Boolean(section)),
  })).filter((group) => group.sections.length > 0);
}

function readFaqHash() {
  return window.location.hash.replace(/^#/, "");
}

/**
 * Track URL hash, including Next.js same-page `/faq#…` navigations that often
 * skip the native `hashchange` event.
 */
function subscribeFaqHash(onStoreChange: () => void) {
  const notify = () => onStoreChange();
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);

  const { pushState, replaceState } = window.history;
  window.history.pushState = function (...args) {
    const result = pushState.apply(this, args as Parameters<typeof pushState>);
    queueMicrotask(notify);
    return result;
  };
  window.history.replaceState = function (...args) {
    const result = replaceState.apply(
      this,
      args as Parameters<typeof replaceState>,
    );
    queueMicrotask(notify);
    return result;
  };

  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
  };
}

function useFaqHash() {
  return useSyncExternalStore(subscribeFaqHash, readFaqHash, () => "");
}

function openFaqTarget(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;

  if (el instanceof HTMLDetailsElement) {
    el.open = true;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function FaqCatalogue() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const hashId = useFaqHash();
  const sections = useMemo(
    () => filterSections(deferredQuery),
    [deferredQuery],
  );
  const jumpGroups = useMemo(() => groupSections(sections), [sections]);
  const totalAnswers = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const isFiltering = deferredQuery.trim().length > 0;
  /** Narrow search results open so people see answers without an extra click. */
  const autoOpenMatches =
    isFiltering && totalAnswers > 0 && totalAnswers <= 8;

  useEffect(() => {
    if (!hashId) return;

    // Search can hide the target Q&A from the DOM — clear it first.
    if (query.trim()) {
      setQuery("");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let frame = 0;

    const tryOpen = () => {
      if (cancelled) return;
      if (openFaqTarget(hashId)) return;
      if (attempts++ >= 40) return;
      frame = requestAnimationFrame(tryOpen);
    };

    tryOpen();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [hashId, query, sections]);

  // Same-hash navbar re-clicks don't change the URL snapshot — open directly.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.pathname !== "/faq" && url.pathname !== "/faq/") return;
      const id = url.hash.replace(/^#/, "");
      if (!id) return;

      window.setTimeout(() => {
        if (query.trim()) {
          setQuery("");
          return;
        }
        openFaqTarget(id);
      }, 0);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [query]);

  useEffect(() => {
    if (!autoOpenMatches) return;

    document.querySelectorAll<HTMLDetailsElement>("details[data-faq-item]").forEach((el) => {
      el.open = true;
    });
  }, [autoOpenMatches, deferredQuery, sections]);

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-12">
        <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-brand-ink sm:text-[2.5rem]">
          FAQ
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-base leading-7 text-brand-muted">
          Find answers about booking, cleaning, pricing and more.
        </p>

        <label className="relative mt-6 block max-w-xl">
          <span className="sr-only">Search FAQs</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle" />
          <input
            autoComplete="off"
            className="h-12 w-full rounded-full border border-brand-lavender bg-white pl-11 pr-11 text-sm text-brand-ink shadow-[0_8px_24px_rgba(49,44,121,0.04)] outline-none transition placeholder:text-[#9a95a8] focus:border-brand-ink/35 focus:shadow-[0_10px_28px_rgba(49,44,121,0.08)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions…"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-brand-subtle transition hover:bg-[#f3eef8] hover:text-brand-ink"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>

        {isFiltering ? (
          <p className="mt-3 text-sm text-brand-subtle">
            {totalAnswers === 0
              ? "No matching answers."
              : `${totalAnswers} ${totalAnswers === 1 ? "answer" : "answers"} across ${sections.length} ${sections.length === 1 ? "topic" : "topics"}`}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col pr-1">
              <div className="mb-4 flex gap-2">
                <button
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-lavender bg-white text-[12px] font-semibold text-brand-ink transition hover:border-brand-ink/25 hover:bg-brand-haze"
                  onClick={() => softScrollToTop()}
                  type="button"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  Top
                </button>
                <button
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-lavender bg-white text-[12px] font-semibold text-brand-ink transition hover:border-brand-ink/25 hover:bg-brand-haze"
                  onClick={() => softScrollToBottom()}
                  type="button"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  Bottom
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
                  Jump to
                </p>
                {jumpGroups.length > 0 ? (
                  <nav aria-label="On this page" className="mt-4 space-y-5">
                    {jumpGroups.map((group) => (
                      <div key={group.id}>
                        <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
                          {group.label}
                        </p>
                        <div className="mt-1.5 space-y-0.5">
                          {group.sections.map((section) => (
                            <a
                              className="block rounded-lg px-2.5 py-1.5 text-[13px] font-medium leading-snug text-brand-muted transition hover:bg-white hover:text-brand-ink"
                              href={`#${section.id}`}
                              key={section.id}
                            >
                              {section.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-brand-subtle">
                    No topics match this search.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-16">
            {sections.map((section) => (
              <section
                className="scroll-mt-32"
                id={section.id}
                key={section.id}
              >
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-ink/10 pb-4">
                  <div>
                    <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-brand-ink sm:text-2xl">
                      {section.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
                      {section.description}
                    </p>
                  </div>
                  <p className="text-xs font-medium tabular-nums text-brand-subtle">
                    {section.items.length}{" "}
                    {section.items.length === 1 ? "answer" : "answers"}
                  </p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {section.items.map((item) => {
                    const anchor = faqItemAnchor(section.id, item.question);
                    return (
                      <details
                        className="group scroll-mt-32 rounded-[1.25rem] border border-brand-lavender/90 bg-white/95 shadow-[0_8px_22px_rgba(49,44,121,0.04)] open:shadow-[0_10px_28px_rgba(49,44,121,0.07)]"
                        data-faq-item=""
                        id={anchor}
                        key={item.question}
                      >
                        <summary className="cursor-pointer list-none px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-start justify-between gap-3">
                            <h3 className="text-[15px] font-semibold leading-snug text-brand-ink sm:text-base">
                              {item.question}
                            </h3>
                            <ChevronDown
                              aria-hidden
                              className="mt-0.5 h-4 w-4 shrink-0 text-brand-subtle transition group-open:rotate-180 group-open:text-brand-purple"
                            />
                          </span>
                        </summary>
                        <div className="faq-answer border-t border-brand-lavender/70 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
                          <p className="whitespace-pre-line text-sm leading-6 text-brand-muted sm:text-[15px] sm:leading-7">
                            {item.answer}
                          </p>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            ))}

            {sections.length === 0 ? (
              <div className="rounded-[1.35rem] border border-dashed border-brand-lavender bg-white/60 px-6 py-10 text-center">
                <p className="text-base font-semibold text-brand-ink">
                  No answers match “{deferredQuery.trim()}”
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Try a shorter phrase, or clear the search to browse all topics.
                </p>
                <button
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-brand-ink px-5 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  Clear search
                </button>
              </div>
            ) : null}

            <section className="rounded-[1.5rem] bg-brand-ink px-6 py-8 text-white sm:px-8 sm:py-10">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] sm:text-2xl">
                Still looking for something?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-[15px] sm:leading-7">
                The Help Centre has longer guides, or you can chat with the
                Mundoria team.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-brand-ink transition hover:bg-[#f3eef8]"
                  href="/help"
                >
                  Help Centre
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-white/50"
                  href="/contact"
                >
                  Contact us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-4 z-40 flex flex-col gap-2 sm:bottom-8 sm:left-6 lg:hidden">
        <button
          aria-label="Scroll to top"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-lavender bg-white text-brand-ink shadow-[0_10px_28px_rgba(49,44,121,0.12)] transition hover:bg-brand-haze"
          onClick={() => softScrollToTop()}
          type="button"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          aria-label="Scroll to bottom"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-lavender bg-white text-brand-ink shadow-[0_10px_28px_rgba(49,44,121,0.12)] transition hover:bg-brand-haze"
          onClick={() => softScrollToBottom()}
          type="button"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
