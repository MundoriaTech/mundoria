"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { HeroReviewsLink } from "@/components/marketing/hero-reviews-link";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { LocationStickyBookBar } from "@/components/marketing/location-sticky-book-bar";
import { MarketingFaqColumnsSection } from "@/components/marketing/marketing-faq-columns-section";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { CategoryServiceCard } from "@/components/marketing/service-category/category-service-card";
import { CategoryServicesCarousel } from "@/components/marketing/service-category/category-services-carousel";
import { PhotoFeatureBand } from "@/components/marketing/service-category/photo-feature-band";

export type CategoryServiceCard = {
  href: string;
  image: string;
  label: string;
  objectPosition?: string;
};

export type CategoryFaq = {
  answer: ReactNode;
  /** Rendered after the optional services checklist. */
  answerAfter?: ReactNode;
  question: string;
  services?: Array<{ description: ReactNode; name: string }>;
  servicesHeading?: string;
};

export type ServiceCategoryMarketingConfig = {
  bookCta: string;
  bullets: [string, string, string];
  faqs: CategoryFaq[];
  faqsTitle?: string;
  faqVariant?: "brand" | "service";
  heroImage: string;
  serviceCards: CategoryServiceCard[];
  servicesTitle: string;
  subtitle: string;
  title: string;
};

export function ServiceCategoryMarketingPage({
  bookingHref,
  config,
  showFaqs = true,
  showReviews = true,
}: {
  bookingHref: string;
  config: ServiceCategoryMarketingConfig;
  /** Set false when a parent route adds Birmingham hub FAQs. */
  showFaqs?: boolean;
  /** Set false when a parent route adds location reviews (e.g. Birmingham hub). */
  showReviews?: boolean;
}) {
  const {
    bookCta,
    bullets,
    faqs,
    faqsTitle = "Mundoria FAQ",
    faqVariant = "brand",
    heroImage,
    servicesTitle,
    subtitle,
    title,
  } = config;

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
            className="object-cover object-[center_30%]"
            fill
            priority
            sizes="100vw"
            src={heroImage}
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
                {title}
              </h1>
              <p className="mt-3 max-w-md text-pretty text-[14px] font-normal leading-6 text-white/95 sm:mt-4 sm:text-base sm:leading-7">
                {subtitle}
              </p>
              <ul className="mt-5 space-y-2.5 text-[13px] font-medium text-white sm:mt-6 sm:text-sm">
                {bullets.map((item) => (
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
                {bookCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PhotoFeatureBand />

      <section className="px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <CategoryServicesCarousel
            label="services"
            title={
              <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
                {servicesTitle}
              </h2>
            }
          >
            {config.serviceCards.map((service) => (
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
          </CategoryServicesCarousel>
        </div>
      </section>

      {showReviews ? <ReviewsSection /> : null}

      {showFaqs ? (
        <MarketingFaqColumnsSection
          footer={
            <div className="hidden justify-center md:flex">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#1c133b]/90"
                href={bookingHref}
              >
                Book a clean
              </Link>
            </div>
          }
          items={faqs.map((faq) => ({
            answer: (
              <>
                {typeof faq.answer === "string" ? <p>{faq.answer}</p> : faq.answer}
                {faq.services ? (
                  <>
                    {faq.servicesHeading ? (
                      <h4 className="mt-4 text-[15px] font-bold leading-snug text-[#1c133b] sm:text-base">
                        {faq.servicesHeading}
                      </h4>
                    ) : null}
                    <ul className="mt-2.5 list-disc space-y-1.5 pl-5">
                      {faq.services.map((service) => (
                        <li key={service.name}>
                          <span className="font-semibold text-[#1c133b]">
                            {service.name}
                          </span>
                          {service.description ? (
                            <>
                              {": "}
                              {service.description}
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {faq.answerAfter}
              </>
            ),
            question: faq.question,
          }))}
          title={faqsTitle}
          variant={faqVariant}
        />
      ) : null}

      <LocationStickyBookBar
        bookingHref={bookingHref}
        label={bookCta || "Book my cleaning"}
      />
    </>
  );
}
