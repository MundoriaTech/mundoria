"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Check } from "lucide-react";

import { HeroReviewsLink } from "@/components/marketing/hero-reviews-link";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { LocationStickyBookBar } from "@/components/marketing/location-sticky-book-bar";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { CategoryServiceCard } from "@/components/marketing/service-category/category-service-card";
import { PhotoFeatureBand } from "@/components/marketing/service-category/photo-feature-band";

const HERO_IMAGE = "/images/marketing/landing/residential-hero.jpg";

const SERVICE_CARDS = [
  {
    href: "/cleaning/regular-cleaning",
    image: "/images/marketing/landing/residential-regular.png",
    label: "Regular Cleaning",
    objectPosition: "object-center",
  },
  {
    href: "/cleaning/move-in-move-out-cleaning",
    image: "/images/marketing/landing/moving-move-in.png",
    label: "Move-in / move-out cleaning",
    objectPosition: "object-center",
  },
  {
    href: "/cleaning/one-off-cleaning",
    image: "/images/marketing/landing/residential-one-off.png",
    label: "One-Off Cleaning",
    objectPosition: "object-center",
  },
  {
    href: "/cleaning/end-of-tenancy-cleaning",
    image: "/images/marketing/landing/moving-end-of-tenancy.png",
    label: "End of Tenancy Cleaning",
    objectPosition: "object-center",
  },
  {
    href: "/cleaning/airbnb-shortlet-cleaning",
    image: "/images/marketing/landing/str-airbnb.png",
    label: "Airbnb/Shortlet Cleaning",
    objectPosition: "object-center",
  },
] as const;

export function ResidentialCleaningPage({
  bookingHref,
}: {
  bookingHref: string;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: 1 | -1) {
    const node = carouselRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8);
    node.scrollBy({ behavior: "smooth", left: direction * amount });
  }

  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        style={{ marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})` }}
      >
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-[center_35%]"
            fill
            priority
            sizes="100vw"
            src={HERO_IMAGE}
          />
          <CategoryHeroOverlay />
        </div>

        <div
          className="relative mx-auto flex min-h-[22rem] w-full max-w-[1400px] flex-col justify-end px-4 pb-8 sm:min-h-[26rem] sm:px-8 sm:pb-10 lg:min-h-[28rem] lg:px-12 lg:pb-12"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2rem)` }}
        >
          <div className="relative">
            <HeroReviewsLink tone="light" />

            <div className="max-w-xl pb-2 sm:pb-4 sm:pr-44">
              <h1 className="text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white min-[400px]:text-[2.35rem] sm:text-5xl lg:text-[3.25rem]">
                Residential Cleaning
              </h1>
              <p className="mt-3 max-w-md text-pretty text-[14px] font-normal leading-6 text-white/95 sm:mt-4 sm:text-base sm:leading-7">
                Everyday homes, deep resets and flexible one-off cleans
              </p>
              <ul className="mt-5 space-y-2.5 text-[13px] font-medium text-white sm:mt-6 sm:text-sm">
                {[
                  "Cleaning from £22/h",
                  "Book once or schedule regularly",
                  "Reliable, vetted cleaners you can trust",
                ].map((item) => (
                  <li className="flex items-start gap-2.5" key={item}>
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-white/90 sm:mt-8"
                href={bookingHref}
              >
                Book residential cleaning
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PhotoFeatureBand />

      <section className="px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="max-w-md text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
              Choose your residential cleaning service
            </h2>
            <div className="flex shrink-0 gap-2 lg:hidden">
              <button
                aria-label="Previous services"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]"
                onClick={() => scrollCarousel(-1)}
                type="button"
              >
                ‹
              </button>
              <button
                aria-label="Next services"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]"
                onClick={() => scrollCarousel(1)}
                type="button"
              >
                ›
              </button>
            </div>
          </div>

          <div
            className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-5 lg:overflow-visible lg:pb-0"
            ref={carouselRef}
          >
            {SERVICE_CARDS.map((service) => (
              <CategoryServiceCard
                bookingHref={bookingHref}
                href={service.href}
                image={service.image}
                key={service.label}
                label={service.label}
                objectPosition={service.objectPosition}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 260px, 240px"
              />
            ))}
          </div>
        </div>
      </section>

      <LocationStickyBookBar bookingHref={bookingHref} />
    </>
  );
}
