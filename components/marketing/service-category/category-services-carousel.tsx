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
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">{title}</div>
        <div className="flex shrink-0 gap-2">
          <button
            aria-label={`Previous ${label}`}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-lg leading-none text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]",
              !canScrollLeft && "pointer-events-none opacity-35",
            )}
            onClick={() => scrollCarousel(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label={`Next ${label}`}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-lg leading-none text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]",
              !canScrollRight && "pointer-events-none opacity-35",
            )}
            onClick={() => scrollCarousel(1)}
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      <div className="relative mt-8">
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
          onScroll={updateScrollState}
          ref={carouselRef}
        >
          {children}
        </div>
        {canScrollRight ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent sm:w-16",
              fadeFromClassName,
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
