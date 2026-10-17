import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { HeroReviewsLink } from "@/components/marketing/hero-reviews-link";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { Button } from "@/components/ui/button";

/** Figma map layer — sits under a lavender wash that fades out toward the bottom. */
const PLACE_HERO_MAP = "/images/marketing/landing/place-hero-map.png";

export function PlaceMapHero({
  bullets,
  description,
  eyebrow,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  showReviews = false,
  title,
}: {
  bullets?: readonly string[];
  description: string;
  eyebrow?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showReviews?: boolean;
  title: string;
}) {
  return (
    <section
      className="relative overflow-hidden bg-[#e9e0f4]"
      style={{ marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})` }}
    >
      {/* Map / pin — kept sharp; lavender layers only tint it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          className="object-cover object-[center_85%]"
          fill
          priority
          sizes="100vw"
          src={PLACE_HERO_MAP}
        />
      </div>

      {/* Light lavender veil — mutes charcoal/red without hiding the map. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#e9e0f4]/45 mix-blend-soft-light"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#dccff0]/30"
      />

      {/* Stronger lavender up top for copy; bottom stays a light tint only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #e9e0f4 0%, #e9e0f4 36%, rgba(233, 224, 244, 0.78) 52%, rgba(233, 224, 244, 0.42) 72%, rgba(233, 224, 244, 0.28) 100%)",
        }}
      />

      <div
        className="relative z-10 mx-auto flex min-h-[28rem] w-full max-w-[1400px] flex-col justify-end px-4 pb-12 sm:min-h-[32rem] sm:px-8 sm:pb-16 lg:min-h-[34rem] lg:px-12 lg:pb-20"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2rem)` }}
      >
        <div className="relative">
          {showReviews ? <HeroReviewsLink tone="dark" /> : null}

          <div className={showReviews ? "max-w-[34rem] sm:pr-44" : "max-w-[34rem]"}>
            {eyebrow ? (
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#823fb2]">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={`text-balance text-[2.15rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#1c133b] min-[400px]:text-[2.5rem] sm:text-5xl lg:text-[3.35rem] ${
                eyebrow ? "mt-4" : ""
              }`}
            >
              {title}
            </h1>
            <p className="mt-4 max-w-[28rem] text-pretty text-[15px] font-normal leading-6 text-[#2a2158]/85 sm:mt-5 sm:text-base sm:leading-7">
              {description}
            </p>
            {bullets?.length ? (
              <ul className="mt-5 space-y-2.5 text-[13px] font-medium text-[#1c133b] sm:mt-6 sm:text-sm">
                {bullets.map((item) => (
                  <li className="flex items-start gap-2.5" key={item}>
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1c133b]/12">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button
                asChild
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#1c133b]/90 sm:h-12 sm:px-7"
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button
                  asChild
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#1c133b]/40 bg-white/50 px-6 text-sm font-semibold text-[#1c133b] backdrop-blur-[2px] transition hover:bg-white/75 sm:h-12 sm:px-7"
                  variant="outline"
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
