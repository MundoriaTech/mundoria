"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Check, Star } from "lucide-react";

import { ReviewsSection } from "@/components/marketing/landing/reviews-section";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import {
  FlexibleIcon,
  ReliableIcon,
  SimpleIcon,
} from "@/components/marketing/residential/feature-icons";
import { LazyImage } from "@/components/shared/lazy-image";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = {
  flexible: FlexibleIcon,
  reliable: ReliableIcon,
  simple: SimpleIcon,
} as const;

const FEATURE_ICON_CLASSES = {
  flexible:
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#d4694a]",
  reliable:
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  simple:
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#5b3d9e]",
} as const;

export type CategoryFeature = {
  body: string;
  icon: keyof typeof FEATURE_ICONS;
  title: string;
};

export type CategoryServiceCard = {
  href: string;
  image: string;
  label: string;
  objectPosition?: string;
};

export type CategoryFaq = {
  answer: string;
  question: string;
  services?: Array<{ description: string; name: string }>;
  servicesHeading?: string;
};

export type ServiceCategoryMarketingConfig = {
  bookCta: string;
  bullets: [string, string, string];
  faqs: CategoryFaq[];
  features: [CategoryFeature, CategoryFeature, CategoryFeature];
  featuresTitle: string;
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
}: {
  bookingHref: string;
  config: ServiceCategoryMarketingConfig;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const {
    bookCta,
    bullets,
    faqs,
    features,
    featuresTitle,
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
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-center"
            fill
            priority
            sizes="100vw"
            src={heroImage}
          />
          <CategoryHeroOverlay />
        </div>

        <div className="relative mx-auto flex min-h-[22rem] w-full max-w-[1400px] flex-col justify-between px-4 py-8 sm:min-h-[26rem] sm:px-8 sm:py-10 lg:min-h-[28rem] lg:px-12 lg:py-12">
          <div className="flex justify-end">
            <a
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/95 transition hover:text-white sm:text-[13px]"
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
          </div>

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
      </section>

      <section className="bg-[#f7f2fc] px-4 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-left text-[1.5rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-[1.75rem] lg:text-[2rem]">
            {featuresTitle}
          </h2>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
            {features.map(({ body, icon, title: featureTitle }) => {
              const Icon = FEATURE_ICONS[icon];
              return (
                <div
                  className="relative min-h-[9.5rem] overflow-hidden rounded-[1.75rem] bg-[#f3efe6] px-5 pb-14 pt-5 sm:min-h-[10.5rem] sm:px-6 sm:pb-16 sm:pt-6"
                  key={featureTitle}
                >
                  <h3 className="pr-14 text-[1.05rem] font-bold leading-tight text-[#1c133b] sm:text-[1.15rem]">
                    {featureTitle}
                  </h3>
                  <p className="mt-2 max-w-[15.5rem] text-[13px] font-normal leading-[1.45] text-[#3d3a48] sm:text-[14px] sm:leading-[1.5]">
                    {body}
                  </p>
                  <Icon
                    className={cn(
                      "pointer-events-none absolute bottom-3 right-3 h-14 w-14 sm:bottom-4 sm:right-4 sm:h-16 sm:w-16",
                      "[filter:drop-shadow(0_0_0.65px_#fff)_drop-shadow(0_0_0.65px_#fff)_drop-shadow(1.25px_0_0_#fff)_drop-shadow(-1.25px_0_0_#fff)_drop-shadow(0_1.25px_0_#fff)_drop-shadow(0_-1.25px_0_#fff)_drop-shadow(1px_1px_0_#fff)_drop-shadow(-1px_1px_0_#fff)_drop-shadow(1px_-1px_0_#fff)_drop-shadow(-1px_-1px_0_#fff)_drop-shadow(0_2px_3px_rgba(28,19,59,0.18))]",
                      FEATURE_ICON_CLASSES[icon],
                    )}
                    weight="duotone"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CategoryServicesSection
        bookingHref={bookingHref}
        carouselRef={carouselRef}
        gridClassName={servicesGridClassName}
        onScroll={scrollCarousel}
        services={config.serviceCards}
        title={servicesTitle}
      />

      <ReviewsSection />

      <section className="bg-[#f3eef8] px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#c45c3a] sm:text-3xl">
            CleanScape FAQ
          </h2>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 sm:gap-5">
            {faqs.map((faq) => (
              <article
                className="mb-4 break-inside-avoid rounded-[1.35rem] border border-[#d8d4e0] bg-[#f7f6f8] px-5 py-5 sm:mb-5 sm:rounded-[1.5rem] sm:px-6 sm:py-6"
                key={faq.question}
              >
                <h3 className="text-[15px] font-bold leading-snug text-[#1c133b] sm:text-base">
                  {faq.question}
                </h3>
                <p className="mt-2.5 text-sm font-normal leading-6 text-[#414141]">
                  {faq.answer}
                </p>
                {faq.services ? (
                  <>
                    <h4 className="mt-4 text-[15px] font-bold leading-snug text-[#1c133b] sm:text-base">
                      {faq.servicesHeading}
                    </h4>
                    <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm font-normal leading-6 text-[#414141]">
                      {faq.services.map((service) => (
                        <li key={service.name}>
                          <span className="font-semibold text-[#1c133b]">
                            {service.name}
                          </span>
                          {" — "}
                          {service.description}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
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
  const count = services.length;
  const defaultGrid =
    count <= 3
      ? "lg:grid-cols-3"
      : count === 4
        ? "lg:grid-cols-2 xl:grid-cols-4"
        : "lg:grid-cols-2 xl:grid-cols-3";

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
            "mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden lg:grid lg:overflow-visible lg:pb-0",
            gridClassName ?? defaultGrid,
          )}
          ref={carouselRef}
        >
          {services.map((service) => (
            <Link
              className="group flex w-[min(78vw,17.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_32px_rgba(28,19,59,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(28,19,59,0.16)] sm:w-[19rem] lg:w-auto"
              href={bookingHref === "/setup" ? "/setup" : service.href}
              key={service.label}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f4ebfe]">
                <LazyImage
                  alt={service.label}
                  className={cn(
                    "object-cover transition duration-500 group-hover:scale-[1.03]",
                    service.objectPosition ?? "object-center",
                  )}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 300px"
                  src={service.image}
                />
              </div>
              <div className="flex min-h-[2.75rem] items-center bg-[#e8def8] px-4 py-2.5">
                <p className="text-[14px] font-semibold leading-snug text-[#312c79]">
                  {service.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
