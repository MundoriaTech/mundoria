"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { Check, Star } from "lucide-react";

import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { MarketingFaqColumnsSection } from "@/components/marketing/marketing-faq-columns-section";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { CategoryServiceCard } from "@/components/marketing/service-category/category-service-card";
import { PhotoFeatureBand } from "@/components/marketing/service-category/photo-feature-band";
import { cn } from "@/lib/utils";

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
  servicesGridClassName?: string;
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const {
    bookCta,
    bullets,
    faqs,
    faqsTitle = "Mundoria FAQ",
    faqVariant = "brand",
    heroImage,
    servicesGridClassName,
    servicesTitle,
    subtitle,
    title,
  } = config;

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
            <a
              className="absolute right-0 top-0 z-10 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/95 transition hover:text-white sm:text-[13px]"
              href="#reviews"
            >
              <span className="inline-flex text-[#c79c66]" aria-hidden>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    className="h-3.5 w-3.5 fill-current"
                    key={index}
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span>
                4.8/5{" "}
                <span className="underline underline-offset-2">Check reviews</span>
              </span>
            </a>

            <div className="max-w-xl pb-2 sm:pb-4">
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
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1c133b] transition hover:bg-white/90 sm:mt-8"
                href={bookingHref}
              >
                {bookCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PhotoFeatureBand />

      <CategoryServicesSection
        bookingHref={bookingHref}
        carouselRef={carouselRef}
        gridClassName={servicesGridClassName}
        onScroll={scrollCarousel}
        services={config.serviceCards}
        title={servicesTitle}
      />

      {showReviews ? <ReviewsSection /> : null}

      {showFaqs ? (
        <MarketingFaqColumnsSection
          footer={
            <div className="flex justify-center">
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
    </>
  );
}

function CategoryServicesSection({
  bookingHref,
  carouselRef,
  gridClassName,
  onScroll,
  services,
  title,
}: {
  bookingHref: string;
  carouselRef: React.RefObject<HTMLDivElement>;
  gridClassName?: string;
  onScroll: (direction: 1 | -1) => void;
  services: CategoryServiceCard[];
  title: string;
}) {
  const defaultGrid = "lg:flex-wrap lg:justify-center lg:gap-5 lg:overflow-visible";

  return (
    <section className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <h2 className="max-w-lg text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
            {title}
          </h2>
          <div className="flex shrink-0 gap-2 lg:hidden">
            <button
              aria-label="Previous services"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]"
              onClick={() => onScroll(-1)}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Next services"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e8def8] bg-white text-[#1c133b] shadow-sm transition hover:bg-[#f7f2fc]"
              onClick={() => onScroll(1)}
              type="button"
            >
              ›
            </button>
          </div>
        </div>

        <div
          className={cn(
            "mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:pb-0",
            gridClassName ?? defaultGrid,
          )}
          ref={carouselRef}
        >
          {services.map((service) => (
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
  );
}
