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
    title: "Airbnb Turnover Cleaning",
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

const CARD_GAP = 26;
const AUTO_SCROLL_SPEED = 0.6;
const AUTO_SCROLL_INTERVAL_MS = 16;
const MANUAL_PAUSE_MS = 5000;

export function PopularServicesSection({
  bookingBaseHref,
}: {
  bookingBaseHref: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pauseAutoScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    let resumeTimeout: ReturnType<typeof setTimeout> | undefined;
    let isVisible = false;
    let paused = false;

    const pause = (duration = MANUAL_PAUSE_MS) => {
      paused = true;
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        paused = false;
      }, duration);
    };

    pauseAutoScrollRef.current = () => pause();

    const step = () => {
      if (!isVisible || paused) return;

      const loopWidth = node.scrollWidth / 2;
      if (loopWidth <= 0 || node.scrollWidth <= node.clientWidth) return;

      const next = node.scrollLeft + AUTO_SCROLL_SPEED;
      node.scrollLeft = next >= loopWidth ? next - loopWidth : next;
    };

    const onUserInteraction = () => pause();

    const onVisibilityChange = () => {
      if (document.hidden) {
        paused = true;
        if (resumeTimeout) clearTimeout(resumeTimeout);
      } else {
        pause(1000);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    const intervalId = setInterval(step, AUTO_SCROLL_INTERVAL_MS);

    node.addEventListener("pointerdown", onUserInteraction);
    node.addEventListener("touchstart", onUserInteraction, { passive: true });
    node.addEventListener("wheel", onUserInteraction, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      pauseAutoScrollRef.current = null;
      observer.disconnect();
      node.removeEventListener("pointerdown", onUserInteraction);
      node.removeEventListener("touchstart", onUserInteraction);
      node.removeEventListener("wheel", onUserInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function scrollByCard(direction: "left" | "right") {
    pauseAutoScrollRef.current?.();

    const node = scrollerRef.current;
    if (!node) return;
    const cardWidth = node.querySelector("article")?.clientWidth ?? 371;
    node.scrollBy({
      behavior: "smooth",
      left: direction === "left" ? -(cardWidth + CARD_GAP) : cardWidth + CARD_GAP,
    });
  }

  const carouselServices = [...popularServices, ...popularServices];

  return (
    <ScrollReveal as="section" className="bg-[#f7f7f7] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[2rem] font-bold tracking-[-0.03em] text-[#414141] sm:text-[36px]">
          Popular Cleaning Services
        </h2>

        <div className="relative mt-10 min-w-0">
          <div
            className="flex w-full min-w-0 touch-pan-x gap-[26px] overflow-x-auto scroll-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            ref={scrollerRef}
          >
            {carouselServices.map((service, index) => {
              const href =
                bookingBaseHref === "/setup"
                  ? "/setup"
                  : service.href.replace("/booking/new", bookingBaseHref);

              return (
                <article
                  className="relative h-[372px] w-[min(86vw,340px)] shrink-0 overflow-hidden rounded-[21px] sm:w-[371px]"
                  key={`${service.title}-${index}`}
                  style={{ backgroundColor: service.color }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[255px]"
                    style={starMaskStyle}
                  >
                    <LazyImage
                      alt=""
                      className="object-cover object-[center_30%]"
                      fill
                      sizes="371px"
                      src={service.image}
                    />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 px-8 pb-7 pt-4">
                    <h3 className="max-w-[15.5rem] whitespace-pre-line text-[28px] font-medium leading-[1.05] text-[#e9e1fa] sm:text-[32px] sm:leading-[33px]">
                      {service.title}
                    </h3>
                    <p className="mt-2 max-w-[15rem] text-[13px] font-light leading-[14px] text-white">
                      {service.description}
                    </p>
                  </div>

                  <Link
                    aria-label={`Book ${service.title.replace("\n", " ")}`}
                    className="absolute bottom-8 right-6 transition hover:scale-105"
                    href={href}
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
