"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CrmLink } from "@/components/analytics/crm-link";
import { SectionBanner } from "@/components/customer/dashboard/section-banner";
import type { PopularService } from "@/lib/customer/popular-services";

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden fill="none" height={18} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24" width={18}>
      <path d={direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}

/** "Popular Services": the most-booked services with their photos, scrolling sideways. */
export function PopularServices({ services }: { services: PopularService[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ end: false, start: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      start: el.scrollLeft <= 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  function scrollByCard(direction: 1 | -1) {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    el.scrollBy({ behavior: "smooth", left: direction * (card.offsetWidth + 16) });
  }

  if (!services.length) return null;

  const arrowClass =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-40";

  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
      <SectionBanner title="Popular Services">
        <div className="hidden gap-2 sm:flex">
          <button aria-label="Previous services" className={arrowClass} disabled={edges.start} onClick={() => scrollByCard(-1)} type="button">
            <Arrow direction="left" />
          </button>
          <button aria-label="More services" className={arrowClass} disabled={edges.end} onClick={() => scrollByCard(1)} type="button">
            <Arrow direction="right" />
          </button>
        </div>
      </SectionBanner>

      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:gap-4 sm:px-5 [&::-webkit-scrollbar]:hidden"
        onScroll={update}
        ref={track}
      >
        {services.map((service, index) => (
          <article
            className="flex w-[78%] max-w-[300px] flex-none snap-start flex-col rounded-[18px] bg-[#f6f1e7] p-2.5 sm:w-[280px] sm:max-w-none"
            data-card
            key={service.type}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[13px] bg-[#efe6d8]">
              <Image
                alt={service.label}
                className="object-cover"
                fill
                priority={index < 2}
                sizes="(max-width: 640px) 78vw, 280px"
                src={service.image}
              />
            </div>
            <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
              <h3 className="m-0 text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#2a2158]">
                {service.label}
              </h3>
              <p className="m-0 mt-1.5 line-clamp-2 text-[14px] leading-5 text-[#5c5670]">
                {service.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {service.pageHref ? (
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#2a2158] px-4 text-[13.5px] font-semibold text-[#2a2158] transition hover:bg-[#2a2158] hover:text-white"
                    href={service.pageHref}
                  >
                    Read more
                    <span className="sr-only"> about {service.label}</span>
                  </Link>
                ) : null}
                <CrmLink
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#2a2158] px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#3d3470]"
                  crmEvent="recommendation_click"
                  crmPayload={{ action: "Book now", item: service.label, service: service.type }}
                  href={service.href}
                >
                  Book now
                  <span className="sr-only"> {service.label}</span>
                </CrmLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
