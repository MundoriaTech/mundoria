"use client";

import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { faqItemAnchor, faqSectionPath, FAQ_HUB_PATH } from "@/lib/seo/faq-paths";

export type FaqSectionViewItem = { answer: string; question: string };

export type FaqSectionNavGroup = {
  id: string;
  label: string;
  sections: Array<{ id: string; title: string }>;
};

/** Open and scroll to the `<details>` named by the URL hash, if any. */
function openHashTarget() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(decodeURIComponent(id));
  if (!el) return;
  if (el instanceof HTMLDetailsElement) el.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function FaqSectionView({
  description,
  groups,
  items,
  next,
  previous,
  sectionId,
  title,
}: {
  description: string;
  groups: FaqSectionNavGroup[];
  items: FaqSectionViewItem[];
  next?: { id: string; title: string } | null;
  previous?: { id: string; title: string } | null;
  sectionId: string;
  title: string;
}) {
  useEffect(() => {
    // Next.js may render before the hash target is painted; try twice.
    openHashTarget();
    const frame = requestAnimationFrame(openHashTarget);
    window.addEventListener("hashchange", openHashTarget);

    // Next.js Link changes same-page hashes with pushState (no hashchange).
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) {
        window.setTimeout(openHashTarget, 0);
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openHashTarget);
      document.removeEventListener("click", onClick, true);
    };
  }, [sectionId]);

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-12">
        <nav aria-label="Breadcrumb" className="text-sm text-[#8b8798]">
          <Link className="font-medium hover:text-[#1c133b]" href={FAQ_HUB_PATH}>
            FAQ
          </Link>
          <span aria-hidden className="px-1.5">
            /
          </span>
          <span className="text-[#5a5470]">{title}</span>
        </nav>
        <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1c133b] sm:text-[2.5rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-base leading-7 text-[#5a5470]">
          {description}
        </p>
        <p className="mt-2 text-xs font-medium tabular-nums text-[#8b8798]">
          {items.length} {items.length === 1 ? "answer" : "answers"}
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b8798]">
                Topics
              </p>
              <nav aria-label="FAQ topics" className="mt-4 space-y-5">
                {groups.map((group) => (
                  <div key={group.id}>
                    <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c79c66]">
                      {group.label}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {group.sections.map((section) => {
                        const current = section.id === sectionId;
                        return (
                          <Link
                            aria-current={current ? "page" : undefined}
                            className={
                              current
                                ? "block rounded-lg bg-white px-2.5 py-1.5 text-[13px] font-semibold leading-snug text-[#1c133b]"
                                : "block rounded-lg px-2.5 py-1.5 text-[13px] font-medium leading-snug text-[#5a5470] transition hover:bg-white hover:text-[#1c133b]"
                            }
                            href={faqSectionPath(section.id)}
                            key={section.id}
                          >
                            {section.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-12">
            <div className="space-y-2.5">
              {items.map((item) => {
                const anchor = faqItemAnchor(sectionId, item.question);
                return (
                  <details
                    className="group scroll-mt-32 rounded-[1.25rem] border border-[#e4daf5]/90 bg-white/95 shadow-[0_8px_22px_rgba(49,44,121,0.04)] open:shadow-[0_10px_28px_rgba(49,44,121,0.07)]"
                    id={anchor}
                    key={item.question}
                  >
                    <summary className="cursor-pointer list-none px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-3">
                        <h2 className="text-[15px] font-semibold leading-snug text-[#1c133b] sm:text-base">
                          {item.question}
                        </h2>
                        <ChevronDown
                          aria-hidden
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#8b8798] transition group-open:rotate-180 group-open:text-[#6a45b8]"
                        />
                      </span>
                    </summary>
                    <div className="border-t border-[#e4daf5]/70 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
                      <p className="whitespace-pre-line text-sm leading-6 text-[#5a5470] sm:text-[15px] sm:leading-7">
                        {item.answer}
                      </p>
                    </div>
                  </details>
                );
              })}
            </div>

            {previous || next ? (
              <nav
                aria-label="More FAQ topics"
                className="grid gap-3 sm:grid-cols-2"
              >
                {previous ? (
                  <Link
                    className="group flex items-center gap-3 rounded-[1.25rem] border border-[#e4daf5] bg-white px-5 py-4 transition hover:border-[#1c133b]/25"
                    href={faqSectionPath(previous.id)}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0 text-[#8b8798] transition group-hover:-translate-x-0.5" />
                    <span>
                      <span className="block text-xs text-[#8b8798]">Previous topic</span>
                      <span className="block text-sm font-semibold text-[#1c133b]">
                        {previous.title}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {next ? (
                  <Link
                    className="group flex items-center justify-end gap-3 rounded-[1.25rem] border border-[#e4daf5] bg-white px-5 py-4 text-right transition hover:border-[#1c133b]/25"
                    href={faqSectionPath(next.id)}
                  >
                    <span>
                      <span className="block text-xs text-[#8b8798]">Next topic</span>
                      <span className="block text-sm font-semibold text-[#1c133b]">
                        {next.title}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#8b8798] transition group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </nav>
            ) : null}

            <FaqStillLooking />
          </div>
        </div>
      </div>
    </>
  );
}

export function FaqStillLooking() {
  return (
    <section className="rounded-[1.5rem] bg-[#1c133b] px-6 py-8 text-white sm:px-8 sm:py-10">
      <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] sm:text-2xl">
        Still looking for something?
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-[15px] sm:leading-7">
        The Help Centre has longer guides, or you can chat with the Mundoria
        team.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f3eef8]"
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
  );
}
