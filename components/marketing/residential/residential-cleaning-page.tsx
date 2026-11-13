"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { HeroReviewsLink } from "@/components/marketing/hero-reviews-link";
import {
  FeaturedCleanerCards,
  type FeaturedCleanerCardData,
} from "@/components/marketing/featured-cleaner-cards";
import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { LocationStickyBookBar } from "@/components/marketing/location-sticky-book-bar";
import { BrandedSection } from "@/components/marketing/branded-page-sections";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { PhotoFeatureBand } from "@/components/marketing/service-category/photo-feature-band";
import type { LandingReview } from "@/lib/marketing/landing-reviews";

const HERO_IMAGE = "/images/marketing/landing/residential-hero.jpg";

export function ResidentialCleaningPage({
  bookingHref,
  cleaners = [],
  fromRateLabel = "£22.00/h",
  place = "Birmingham",
  reviews = [],
}: {
  bookingHref: string;
  cleaners?: FeaturedCleanerCardData[];
  /** Live admin rate-card label, e.g. "£22.00/h". */
  fromRateLabel?: string;
  place?: string;
  reviews?: LandingReview[];
}) {
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
                House Cleaning
              </h1>
              <p className="mt-3 max-w-md text-pretty text-[14px] font-normal leading-6 text-white/95 sm:mt-4 sm:text-base sm:leading-7">
                Everyday homes, deep resets and flexible one-off cleans
              </p>
              <ul className="mt-5 space-y-2.5 text-[13px] font-medium text-white sm:mt-6 sm:text-sm">
                {[
                  `Cleaning from ${fromRateLabel}`,
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
                className="mt-6 hidden h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-white/90 md:inline-flex sm:mt-8"
                href={bookingHref}
              >
                Book house cleaning
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PhotoFeatureBand />

      <ReviewsSection
        heading={`Cleaning reviews in ${place}`}
        reviews={reviews}
      />

      {cleaners.length ? (
        <BrandedSection tone="cream">
          <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            Your next cleaner could be right here.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5470]">
            Find a vetted cleaner in Birmingham, with ratings from completed
            visits.
          </p>
          <FeaturedCleanerCards bookingHref={bookingHref} cleaners={cleaners} />
        </BrandedSection>
      ) : null}

      <LocationStickyBookBar bookingHref={bookingHref} />
    </>
  );
}
