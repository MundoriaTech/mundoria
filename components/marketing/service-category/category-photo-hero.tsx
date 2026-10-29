import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { HeroReviewsLink } from "@/components/marketing/hero-reviews-link";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { CategoryHeroOverlay } from "@/components/marketing/service-category/category-hero-overlay";
import { marketingServiceBySlug } from "@/lib/seo/marketing";
import type { PlacePageFocus } from "@/lib/seo/place-page-focus";
import { serviceDetailConfig } from "@/lib/seo/service-detail-config";

type PlacePhotoHero = {
  bookCta: string;
  bullets: readonly string[];
  image: string;
  overlay: "soft" | "wash";
  subtitle: string;
  title: string;
};

export function placePhotoHero(
  name: string,
  focus?: PlacePageFocus,
): PlacePhotoHero | null {
  if (focus?.serviceSlug) {
    const service = marketingServiceBySlug(focus.serviceSlug);
    if (!service) return null;
    const config = serviceDetailConfig(service);
    return {
      bookCta: config.bookCta,
      bullets: config.bullets,
      image: config.heroImage,
      overlay: "wash",
      subtitle: config.subtitle,
      title: `${config.title} in ${name}`,
    };
  }

  if (focus?.category === "commercial") {
    return {
      bookCta: "Book workspace cleaning",
      bullets: [
        "One-off or recurring workplace cleans",
        "Clear estimates before you book",
        "Reliable, vetted cleaners you can trust",
      ],
      image: "/images/marketing/landing/commercial-hero.jpg",
      overlay: "wash",
      subtitle:
        "Offices, retail, education and communal spaces — cleaned without the chase",
      title: `Workspace Cleaning in ${name}`,
    };
  }

  if (focus?.category === "residential") {
    return {
      bookCta: "Book residential cleaning",
      bullets: [
        "Cleaning from £22/h",
        "Book once or schedule regularly",
        "Reliable, vetted cleaners you can trust",
      ],
      image: "/images/marketing/landing/residential-hero.jpg",
      overlay: "soft",
      subtitle: "Everyday homes, deep resets and flexible one-off cleans",
      title: `Residential Cleaning in ${name}`,
    };
  }

  if (focus?.category === "recovery") {
    return {
      bookCta: "Book recovery cleaning",
      bullets: [
        "Cleaning that adapts when life does",
        "Share preferences before the cleaner arrives",
        "Still cleaning — not healthcare or personal care",
      ],
      image: "/images/marketing/landing/recovery-hero.jpg",
      overlay: "wash",
      subtitle:
        "Cleaning that adapts when life does — with a little more consideration",
      title: `Recovery cleaning in ${name}`,
    };
  }

  return null;
}

export function CategoryPhotoHero({
  bookingHref,
  hero,
}: {
  bookingHref: string;
  hero: PlacePhotoHero;
}) {
  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})` }}
    >
      <div className="absolute inset-0">
        <Image
          alt=""
          aria-hidden
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src={hero.image}
        />
        {hero.overlay === "wash" ? (
          <CategoryHeroOverlay />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#1c133b]/55 via-[#291845]/25 to-transparent"
          />
        )}
      </div>

      <div
        className="relative mx-auto flex min-h-[22rem] w-full max-w-[1400px] flex-col justify-end px-4 pb-8 sm:min-h-[26rem] sm:px-8 sm:pb-10 lg:min-h-[28rem] lg:px-12 lg:pb-12"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2rem)` }}
      >
        <div className="relative">
          <HeroReviewsLink tone="light" />

          <div className="max-w-xl pb-2 sm:pb-4 sm:pr-44">
            <h1 className="text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white min-[400px]:text-[2.35rem] sm:text-5xl lg:text-[3.25rem]">
              {hero.title}
            </h1>
            <p className="mt-3 max-w-md text-pretty text-[14px] font-normal leading-6 text-white/95 sm:mt-4 sm:text-base sm:leading-7">
              {hero.subtitle}
            </p>
            <ul className="mt-5 space-y-2.5 text-[13px] font-medium text-white sm:mt-6 sm:text-sm">
              {hero.bullets.map((item) => (
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
              {hero.bookCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
