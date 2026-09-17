"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";

import { CategoryLoopMedia } from "@/components/marketing/landing/category-loop-media";
import {
  landingCategoryImages,
  landingCategoryLoops,
} from "@/components/marketing/landing/constants";
import { LazyImage } from "@/components/shared/lazy-image";
import { SERVICE_CATEGORIES } from "@/lib/customer/services";
import type { ServiceCategoryDefinition } from "@/lib/customer/services";
import { cn } from "@/lib/utils";

/** Landing “Smart Service categories” — three primary entry points. */
const smartMainCategories = [
  "residential",
  "commercial",
  "recovery",
] as const;

/** Card title text as shown on the landing design. */
const smartCategoryLabels: Record<(typeof smartMainCategories)[number], string> =
  {
    commercial: "Commercial Cleaning",
    recovery: "Mundoria Recovery Cleaning",
    residential: "Residential Cleaning",
  };

/** Bottom label bar colours from the landing design. */
const smartCategoryBarColors: Record<(typeof smartMainCategories)[number], string> =
  {
    commercial: "#FC9297",
    recovery: "#8B40A8",
    residential: "#CF4696",
  };

function getCategory(value: string) {
  return SERVICE_CATEGORIES.find((category) => category.value === value)!;
}

function usePrefersHover() {
  const [prefersHover, setPrefersHover] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setPrefersHover(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return prefersHover;
}

function useInView(amount = 0.55): [RefObject<HTMLAnchorElement>, boolean] {
  const ref = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "0px 0px -12% 0px", threshold: amount },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount]);

  return [ref, inView];
}

export function ServiceCategoriesSection({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <section
      className="relative z-10 -mt-8 overflow-x-clip px-4 pb-8 pt-0 min-[400px]:px-5 sm:-mt-12 sm:px-8 sm:pb-12 lg:-mt-14"
      id="services"
    >
      <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#F3E6D6] px-4 py-10 min-[400px]:px-5 sm:rounded-[2rem] sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:gap-8">
          <div className="relative z-10 max-w-[516px] shrink-0">
            <div>
              <p className="text-[11px] font-normal uppercase tracking-[0.24em] text-black min-[400px]:text-[12px] sm:tracking-[0.43em]">
                Smart Service categories
              </p>
              <h2 className="mt-3 text-balance text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1c133b] min-[400px]:text-[1.85rem] sm:text-[2.5rem] lg:text-[40px] lg:leading-[41px]">
                Every cleaning need, clearly organised.
              </h2>
            </div>
            <p className="mt-3 max-w-[376px] text-pretty text-[13px] font-light leading-5 text-black sm:mt-4 sm:leading-[17px]">
              Choose a category to start. Mundoria guides you to the right
              service, cleaning standard and optional add-ons.
            </p>
          </div>
        </div>

        {/* 1-col until lg — avoids the awkward 2+1 orphan mid layout on phones/tablets */}
        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:mt-10 sm:gap-5 lg:mx-auto lg:mt-[72px] lg:max-w-[921px] lg:grid-cols-3 lg:gap-6">
          {smartMainCategories.map((value) => (
            <CategoryCard
              barColor={smartCategoryBarColors[value]}
              bookingHref={bookingHref}
              category={getCategory(value)}
              key={value}
              label={smartCategoryLabels[value]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  barColor,
  bookingHref,
  category,
  label,
}: {
  barColor: string;
  bookingHref: string;
  category: ServiceCategoryDefinition;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);
  const prefersHover = usePrefersHover();
  const [cardRef, inView] = useInView(0.5);
  const active = prefersHover ? hovered : inView;

  const href =
    bookingHref === "/setup"
      ? "/setup"
      : category.value === "residential"
        ? "/cleaning/residential"
        : category.value === "commercial"
          ? "/cleaning/commercial"
          : category.value === "recovery"
            ? "/cleaning/recovery"
            : `${bookingHref}?category=${category.value}`;

  const loop = landingCategoryLoops[category.value];
  const stillSrc =
    landingCategoryImages[category.value] ?? landingCategoryImages.residential;

  return (
    <Link
      className={cn(
        "group relative mx-auto block w-full max-w-[22rem] overflow-hidden rounded-tl-[24px] shadow-[0_10px_28px_rgba(28,19,59,0.14)] transition duration-300",
        "aspect-[16/10] sm:aspect-[4/3] lg:aspect-[295/284] lg:max-w-none",
        "hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(28,19,59,0.18)] sm:rounded-tl-[29px]",
      )}
      href={href}
      onBlur={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={cardRef}
    >
      {loop?.video ? (
        <CategoryLoopMedia
          active={active}
          alt={label}
          mediaClassName={
            category.value === "commercial"
              ? // Landscape source: subject sits left. Mobile/wide cards need object-position;
                // near-square lg cards keep the original scale/shift crop.
                "object-[8%_40%] scale-[1.06] -translate-x-[3%] group-hover:scale-[1.1] lg:translate-x-[6%] lg:object-center lg:scale-[1.18] lg:-translate-y-[10%] lg:group-hover:scale-[1.22]"
              : undefined
          }
          posterSrc={loop.poster}
          videoSrc={loop.video}
        />
      ) : (
        <LazyImage
          alt={label}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(min-width: 1024px) 295px, 92vw"
          src={stillSrc}
        />
      )}

      <div
        className="absolute inset-x-0 bottom-0 z-10 flex min-h-[3rem] items-center px-3.5 py-2.5 sm:min-h-[3.25rem] sm:px-4 sm:py-3"
        style={{ backgroundColor: barColor }}
      >
        <p className="text-pretty text-[14px] font-bold leading-snug text-white sm:text-[15px] sm:leading-tight lg:text-[15px]">
          {label}
        </p>
      </div>
    </Link>
  );
}
