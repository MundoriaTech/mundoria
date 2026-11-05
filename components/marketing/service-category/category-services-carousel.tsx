"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function CategoryServicesCarousel({
  children,
  fadeFromClassName = "from-[#faf8ff]",
  label,
  title,
}: {
  children: React.ReactNode;
  /** Tailwind `from-*` class matching the section background for the right-edge fade. */
  fadeFromClassName?: string;
  /** Accessible name for the carousel controls. */
  label: string;
  title: React.ReactNode;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const node = carouselRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(max - node.scrollLeft > 4);
  }

  function scrollCarousel(direction: 1 | -1) {
    const node = carouselRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8);
    node.scrollBy({ behavior: "smooth", left: direction * amount });
  }

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;
    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, []);

  return (
    <div>
      <div>{title}</div>

      <div className="relative mt-8">
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
          onScroll={updateScrollState}
          ref={carouselRef}
        >
          {children}
        </div>

        {canScrollLeft ? (
          <button
            aria-label={`Previous ${label}`}
            className="absolute left-0 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8def8] bg-white text-lg leading-none text-[#1c133b] shadow-md transition hover:bg-[#f7f2fc]"
            onClick={() => scrollCarousel(-1)}
            type="button"
          >
            ‹
          </button>
        ) : null}

        {canScrollRight ? (
          <>
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent sm:w-16",
                fadeFromClassName,
              )}
            />
            <button
              aria-label={`Next ${label}`}
              className="absolute right-0 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8def8] bg-white text-lg leading-none text-[#1c133b] shadow-md transition hover:bg-[#f7f2fc]"
              onClick={() => scrollCarousel(1)}
              type="button"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
