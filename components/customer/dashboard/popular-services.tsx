"use client";

import Image from "next/image";
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
          <CrmLink
            aria-label={`Book ${service.label}`}
            className="group relative block h-[190px] w-[70%] max-w-[260px] flex-none snap-start overflow-hidden rounded-[16px] bg-[#1E1848] sm:h-[210px] sm:w-[240px] sm:max-w-none"
            crmEvent="recommendation_click"
            crmPayload={{ action: "Book now", item: service.label, service: service.type }}
            data-card
            href={service.href}
            key={service.type}
          >
            <Image
              alt=""
              className="object-cover transition duration-500 group-hover:scale-[1.05]"
              fill
              priority={index < 2}
              sizes="(max-width: 640px) 70vw, 240px"
              src={service.image}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg,rgba(24,18,58,0.88) 0%,rgba(24,18,58,0.45) 32%,rgba(24,18,58,0) 58%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <span className="text-[16px] font-semibold leading-tight tracking-[-0.01em] text-white [text-wrap:balance]">
                {service.label}
              </span>
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#524096] shadow-sm transition group-hover:translate-x-0.5"
              >
                <Arrow direction="right" />
              </span>
            </div>
          </CrmLink>
        ))}
      </div>
    </section>
  );
}
