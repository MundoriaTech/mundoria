"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LazyImage } from "@/components/shared/lazy-image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

const STAR_FRAME_MASK = "/images/marketing/landing/star-frame-mask.png";

type PopularService = {
  color: string;
  description: string;
  href: string;
  image: string;
  title: string;
};

const popularServices: PopularService[] = [
  {
    color: "#45347e",
    description: "Reliable upkeep for a consistently fresh home.",
    href: "/booking/new?service=regular",
    image: "/images/marketing/landing/popular-regular.png",
    title: "Regular\nCleaning",
  },
  {
    color: "#823fb2",
    description: "Detailed attention for built-up dirt and overlooked areas.",
    href: "/booking/new?service=deep_clean",
    image: "/images/marketing/landing/popular-deep.png",
    title: "Deep Cleaning",
  },
  {
    color: "#e67248",
    description: "Move-out cleaning designed for landlord and agent standards.",
    href: "/booking/new?service=end_of_tenancy",
    image: "/images/marketing/landing/popular-tenancy.png",
    title: "End of Tenancy Cleaning",
  },
  {
    color: "#a53ba7",
    description: "Fast turnovers with checklist-led guest-ready standards.",
    href: "/booking/new?service=airbnb_turnover",
    image: "/images/marketing/landing/popular-regular.png",
    title: "Airbnb Cleaning",
  },
  {
    color: "#45347e",
    description: "Routine workplace cleaning for offices and studios.",
    href: "/booking/new?service=office",
    image: "/images/marketing/landing/popular-deep.png",
    title: "Office Cleaning",
  },
  {
    color: "#e67248",
    description: "Respectful practical cleaning support after bereavement.",
    href: "/booking/new?service=bereavement_support",
    image: "/images/marketing/landing/popular-tenancy.png",
    title: "Bereavement Support Cleaning",
  },
];

const starMaskStyle = {
  WebkitMaskImage: `url("${STAR_FRAME_MASK}")`,
  maskImage: `url("${STAR_FRAME_MASK}")`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center top",
  maskPosition: "center top",
} as const;

/** px/frame at ~60fps ≈ previous 0.6px / 16ms cadence */
const AUTO_SCROLL_SPEED = 36;
const MANUAL_PAUSE_MS = 5000;

export function PopularServicesSection({
  bookingBaseHref,
}: {
  bookingBaseHref: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startOffset: number;
    moved: boolean;
    pointerId: number | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startOffset: 0,
    moved: false,
    pointerId: null,
  });
  const pauseAutoScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let rafId = 0;
    let lastTs = 0;
    let isVisible = false;
    let reduceMotion = false;

    const measure = () => {
      // First half of the duplicated track = one seamless loop
      loopWidthRef.current = track.scrollWidth / 2;
    };

    const apply = () => {
      const loop = loopWidthRef.current;
      if (loop > 0) {
        offsetRef.current = ((offsetRef.current % loop) + loop) % loop;
      }
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    };

    const pause = (duration = MANUAL_PAUSE_MS) => {
      pauseUntilRef.current = performance.now() + duration;
    };

    pauseAutoScrollRef.current = () => pause();

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick);
      if (!lastTs) lastTs = ts;
      const dt = Math.min(64, ts - lastTs) / 1000;
      lastTs = ts;

      if (
        !isVisible ||
        reduceMotion ||
        ts < pauseUntilRef.current ||
        dragRef.current.active ||
        loopWidthRef.current <= 0
      ) {
        return;
      }

      offsetRef.current += AUTO_SCROLL_SPEED * dt;
      apply();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        pauseUntilRef.current = Number.POSITIVE_INFINITY;
      } else {
        pause(800);
        lastTs = 0;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragRef.current = {
        active: false,
        startX: event.clientX,
        startY: event.clientY,
        startOffset: offsetRef.current,
        moved: false,
        pointerId: event.pointerId,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.active) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        // Vertical intent → let the page scroll
        if (Math.abs(dy) > Math.abs(dx)) {
          drag.pointerId = null;
          return;
        }
        drag.active = true;
        pause();
        viewport.setPointerCapture(event.pointerId);
      }

      drag.moved = true;
      offsetRef.current = drag.startOffset - dx;
      apply();
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      const wasDragging = drag.active;
      drag.active = false;
      drag.pointerId = null;
      if (wasDragging) {
        pause();
        try {
          viewport.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      reduceMotion = mediaQuery.matches;
    };
    syncMotion();

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        if (isVisible) lastTs = 0;
      },
      { threshold: 0.12 },
    );

    const resizeObserver = new ResizeObserver(() => {
      measure();
      apply();
    });

    measure();
    apply();
    observer.observe(viewport);
    resizeObserver.observe(track);
    rafId = requestAnimationFrame(tick);

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("visibilitychange", onVisibilityChange);
    mediaQuery.addEventListener("change", syncMotion);

    return () => {
      cancelAnimationFrame(rafId);
      pauseAutoScrollRef.current = null;
      observer.disconnect();
      resizeObserver.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mediaQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  function scrollByCard(direction: "left" | "right") {
    pauseAutoScrollRef.current?.();

    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector("article");
    if (!card) return;

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "16") || 16;
    const step = card.getBoundingClientRect().width + gap;
    offsetRef.current += direction === "left" ? -step : step;

    const loop = loopWidthRef.current || track.scrollWidth / 2;
    if (loop > 0) {
      offsetRef.current = ((offsetRef.current % loop) + loop) % loop;
    }
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  }

  const carouselServices = [...popularServices, ...popularServices];

  return (
    <ScrollReveal
      as="section"
      className="overflow-x-clip px-4 py-14 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-balance text-[1.75rem] font-bold tracking-[-0.03em] text-white sm:text-[36px]">
          Popular Cleaning Services
        </h2>

        <div className="relative mt-8 min-w-0 sm:mt-10">
          <div
            className="w-full min-w-0 cursor-grab overflow-hidden active:cursor-grabbing touch-pan-y"
            ref={viewportRef}
            style={{ touchAction: "pan-y" }}
          >
            <div
              className="flex w-max gap-4 will-change-transform sm:gap-[26px]"
              ref={trackRef}
            >
              {carouselServices.map((service, index) => {
                const href =
                  bookingBaseHref === "/setup"
                    ? "/setup"
                    : service.href.replace("/booking/new", bookingBaseHref);

                return (
                  <article
                    className="relative h-[340px] w-[min(82vw,300px)] shrink-0 overflow-hidden rounded-[21px] sm:h-[372px] sm:w-[371px]"
                    key={`${service.title}-${index}`}
                    style={{ backgroundColor: service.color }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-[220px] sm:h-[255px]"
                      style={starMaskStyle}
                    >
                      <LazyImage
                        alt=""
                        className="object-cover object-[center_30%]"
                        fill
                        sizes="(min-width: 640px) 371px, 82vw"
                        src={service.image}
                      />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-4 sm:px-8 sm:pb-7">
                      <h3 className="max-w-[15.5rem] whitespace-pre-line text-[1.375rem] font-medium leading-[1.08] text-[#e9e1fa] sm:text-[32px] sm:leading-[33px]">
                        {service.title}
                      </h3>
                      <p className="mt-2 max-w-[15rem] text-[12px] font-light leading-[1.25] text-white sm:text-[13px] sm:leading-[14px]">
                        {service.description}
                      </p>
                    </div>

                    <Link
                      aria-label={`Book ${service.title.replace("\n", " ")}`}
                      className="absolute bottom-6 right-5 transition hover:scale-105 sm:bottom-8 sm:right-6"
                      href={href}
                      onClick={(event) => {
                        if (dragRef.current.moved) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <LazyImage
                        alt=""
                        className="h-[25px] w-[31px]"
                        height={25}
                        src="/images/marketing/landing/Arrow.png"
                        width={31}
                      />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              aria-label="Previous popular services"
              className="flex size-[31px] items-center justify-center rounded-full bg-[#45347e] text-white transition hover:bg-[#312c79]"
              onClick={() => scrollByCard("left")}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Next popular services"
              className="flex size-[31px] items-center justify-center rounded-full bg-[#45347e] text-white transition hover:bg-[#312c79]"
              onClick={() => scrollByCard("right")}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
