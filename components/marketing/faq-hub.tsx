"use client";

import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { FaqStillLooking } from "@/components/marketing/faq-section-view";
import {
  faqItemPath,
  faqSectionPath,
  legacyFaqHashTarget,
} from "@/lib/seo/faq-paths";

type HubItem = { answer: string; question: string };
type HubSection = {
  description: string;
  id: string;
  items: HubItem[];
  title: string;
};
type HubGroup = {
  description: string;
  id: string;
  label: string;
  sectionIds: string[];
};

const MAX_RESULTS = 40;

function FaqAnswerCard({
  answer,
  question,
  sectionId,
  sectionTitle,
}: HubItem & { sectionId: string; sectionTitle: string }) {
  return (
    <details className="group rounded-[1.25rem] border border-[#e4daf5]/90 bg-white/95 shadow-[0_8px_22px_rgba(49,44,121,0.04)] open:shadow-[0_10px_28px_rgba(49,44,121,0.07)]">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-[#1c133b] sm:text-base">
            {question}
          </h3>
          <ChevronDown
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-[#8b8798] transition group-open:rotate-180 group-open:text-[#6a45b8]"
          />
        </span>
      </summary>
      <div className="border-t border-[#e4daf5]/70 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <p className="whitespace-pre-line text-sm leading-6 text-[#5a5470] sm:text-[15px] sm:leading-7">
          {answer}
        </p>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
          href={faqItemPath(sectionId, question)}
        >
          More in {sectionTitle}
        </Link>
      </div>
    </details>
  );
}

export function FaqHub({
  groups,
  sections,
  top,
}: {
  groups: HubGroup[];
  sections: HubSection[];
  top: Array<HubItem & { sectionId: string }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const byId = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  // Old links pointed at `/faq#section-question`; send them to the new page.
  useEffect(() => {
    const target = legacyFaqHashTarget(
      window.location.hash,
      sections.map((section) => section.id),
    );
    if (target) router.replace(target);
  }, [router, sections]);

  const results = useMemo(() => {
    const terms = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return null;
    return sections.flatMap((section) =>
      section.items
        .filter((item) => {
          const haystack = `${item.question} ${item.answer}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
        .map((item) => ({ ...item, sectionId: section.id, sectionTitle: section.title })),
    );
  }, [deferredQuery, sections]);

  const total = sections.reduce((count, section) => count + section.items.length, 0);

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-12">
        <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#1c133b] sm:text-[2.5rem]">
          Frequently asked questions
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-base leading-7 text-[#5a5470]">
          {total} answers about booking, prices, payments, cleaners,
          cancellations and every Mundoria service.
        </p>

        <label className="relative mt-6 block max-w-xl">
          <span className="sr-only">Search FAQs</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8798]" />
          <input
            autoComplete="off"
            className="h-12 w-full rounded-full border border-[#e4daf5] bg-white pl-11 pr-11 text-sm text-[#1c133b] shadow-[0_8px_24px_rgba(49,44,121,0.04)] outline-none transition placeholder:text-[#9a95a8] focus:border-[#1c133b]/35 focus:shadow-[0_10px_28px_rgba(49,44,121,0.08)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all answers…"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8b8798] transition hover:bg-[#f3eef8] hover:text-[#1c133b]"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>
        {results ? (
          <p aria-live="polite" className="mt-3 text-sm text-[#8b8798]">
            {results.length === 0
              ? "No matching answers."
              : `${results.length} ${results.length === 1 ? "answer" : "answers"}${results.length > MAX_RESULTS ? `, showing the first ${MAX_RESULTS}` : ""}`}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        {results ? (
          results.length ? (
            <div className="space-y-2.5">
              {results.slice(0, MAX_RESULTS).map((item) => (
                <FaqAnswerCard key={`${item.sectionId}:${item.question}`} {...item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-[#e4daf5] bg-white/60 px-6 py-10 text-center">
              <p className="text-base font-semibold text-[#1c133b]">
                No answers match “{deferredQuery.trim()}”
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                Try a shorter phrase, or browse the topics below.
              </p>
              <button
                className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                onClick={() => setQuery("")}
                type="button"
              >
                Clear search
              </button>
            </div>
          )
        ) : (
          <>
            {top.length ? (
              <section aria-labelledby="faq-top">
                <h2
                  className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl"
                  id="faq-top"
                >
                  Most asked
                </h2>
                <div className="mt-5 space-y-2.5">
                  {top.map((item) => (
                    <FaqAnswerCard
                      key={`${item.sectionId}:${item.question}`}
                      {...item}
                      sectionTitle={byId.get(item.sectionId)?.title ?? "this topic"}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {groups.map((group) => {
              const groupSections = group.sectionIds
                .map((id) => byId.get(id))
                .filter((section): section is HubSection => Boolean(section));
              if (!groupSections.length) return null;
              return (
                <section aria-labelledby={`faq-group-${group.id}`} key={group.id}>
                  <div className="border-b border-[#1c133b]/10 pb-4">
                    <h2
                      className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl"
                      id={`faq-group-${group.id}`}
                    >
                      {group.label}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
                      {group.description}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groupSections.map((section) => (
                      <Link
                        className="group flex flex-col rounded-[1.25rem] border border-[#e4daf5]/90 bg-white/95 px-5 py-4 shadow-[0_8px_22px_rgba(49,44,121,0.04)] transition hover:border-[#1c133b]/25 hover:shadow-[0_10px_28px_rgba(49,44,121,0.08)]"
                        href={faqSectionPath(section.id)}
                        key={section.id}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-[15px] font-semibold leading-snug text-[#1c133b]">
                            {section.title}
                          </span>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#8b8798] transition group-hover:translate-x-0.5 group-hover:text-[#6a45b8]" />
                        </span>
                        <span className="mt-1.5 text-sm leading-6 text-[#5a5470]">
                          {section.description}
                        </span>
                        <span className="mt-3 text-xs font-medium tabular-nums text-[#8b8798]">
                          {section.items.length}{" "}
                          {section.items.length === 1 ? "answer" : "answers"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        <FaqStillLooking />
      </div>
    </>
  );
}
