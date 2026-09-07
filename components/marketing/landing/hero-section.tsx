"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const HERO_SWAP_MS = 4000;

/** Transparent PNG layers that composite to Frame 29 (minus live HTML copy). */
const HERO_ALT_CLEANER = "/images/marketing/landing/hero-alt-cleaner.png";
const HERO_ALT_WAVES = "/images/marketing/landing/hero-alt-waves.png";

/** Sampled from Frame 29 purple field. */
const ALT_PURPLE = "#291845";
const ALT_GOLD = "#c79c66";

/** Frame 29 canvas — used for desktop swap proportions only. */
const HERO_ASPECT_CLASS = "lg:aspect-[1552/953]";

export function HeroSection({ bookingHref }: { bookingHref: string }) {
  const [variant, setVariant] = useState<"default" | "alt">("default");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) {
      setVariant("default");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVariant("alt");
      return;
    }

    // Hover-swap is desktop-only; phones stay on the default hero.
    if (!window.matchMedia("(hover: hover) and (min-width: 1024px)").matches) {
      return;
    }

    setVariant("alt");
    const id = window.setInterval(() => {
      setVariant((current) => (current === "default" ? "alt" : "default"));
    }, HERO_SWAP_MS);

    return () => window.clearInterval(id);
  }, [hovered]);

  return (
    <section
      className="overflow-x-clip px-3 pb-14 pt-2 min-[380px]:px-4 sm:px-8 sm:pb-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/*
        Mobile: default hero owns natural height (no landscape aspect crush).
        Desktop (lg+): shared Frame 29 aspect box so default ↔ alt swap seamlessly.
      */}
      <div className="relative mx-auto w-full max-w-[1551px] pb-9 sm:pb-11">
        <div className={cn("relative w-full", HERO_ASPECT_CLASS)}>
          <div
            aria-hidden={variant !== "default"}
            className={cn(
              "transition-opacity duration-700 ease-in-out",
              "relative lg:absolute lg:inset-0",
              variant === "default"
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0 max-lg:hidden",
            )}
          >
            <DefaultHero bookingHref={bookingHref} />
          </div>

          <div
            aria-hidden={variant !== "alt"}
            className={cn(
              "absolute inset-0 hidden transition-opacity duration-700 ease-in-out lg:block",
              variant === "alt"
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0",
            )}
          >
            <AlternateHero bookingHref={bookingHref} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DefaultHero({ bookingHref }: { bookingHref: string }) {
  return (
    <div className="relative isolate flex h-auto flex-col rounded-[20px] bg-white px-3 pb-8 min-[380px]:px-5 sm:rounded-[38px] sm:px-10 sm:pb-10 sm:pt-2 lg:h-full lg:pb-0 lg:pt-1 lg:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] sm:rounded-[38px]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(200.22deg, rgba(230, 229, 243, 0.51) 17%, rgba(139, 123, 185, 0.51) 86%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-[0.74]"
          style={{
            backgroundImage:
              "url(/images/marketing/landing/hero-stripes.png)",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      </div>

      {/* Clip media/copy to the rounded frame; metrics sit outside this layer so they aren’t cut off. */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] sm:rounded-[38px]">
        <div className="mx-auto flex w-full max-w-[767px] shrink-0 flex-col items-center pt-5 text-center sm:pt-6 lg:pt-7">
          <h1 className="text-balance text-[1.625rem] font-medium leading-[1.08] tracking-[-0.04em] text-[#1c133b] min-[380px]:text-[2rem] sm:text-4xl lg:text-[clamp(1.25rem,2.8vw,2.75rem)]">
            Book Trusted Home Cleaning service in Minutes
          </h1>
          <p className="mx-auto mt-2 max-w-[550px] text-pretty text-[13px] font-normal leading-5 text-[#1c133b] sm:mt-3 sm:text-[14px] sm:leading-[21px] lg:mt-1.5 lg:text-[clamp(0.7rem,1.1vw,0.875rem)] lg:leading-[1.45]">
            From residential and commercial cleaning to short-term rentals,
            exterior work and recovery support, book certified professionals,
            track every visit, and pay only after the job is complete.
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1c133b] px-6 py-2.5 text-[13px] font-medium text-[#e6e5f3] transition hover:bg-[#1c133b]/90 sm:mt-4 sm:min-h-0 sm:h-[29px] sm:px-5 sm:py-0 sm:text-[12px] lg:mt-2.5 lg:min-h-10 lg:px-5 lg:py-2 lg:text-[12px]"
            href={bookingHref}
          >
            Book a Service
          </Link>
        </div>

        {/* Mobile: intrinsic image height. Desktop: fill remaining aspect-box space. */}
        <div className="relative mx-auto mt-4 block w-full max-w-[980px] sm:mt-5 lg:mt-2 lg:min-h-0 lg:flex-1">
          <Image
            alt="CleanScape cleaning professionals"
            className="mx-auto block h-auto w-full lg:hidden"
            height={503}
            priority
            sizes="92vw"
            src="/images/marketing/landing/hero-cleaners.png"
            width={1296}
          />
          <Image
            alt="CleanScape cleaning professionals"
            className="hidden object-contain object-bottom lg:block"
            fill
            priority
            sizes="(min-width: 1280px) 980px, 92vw"
            src="/images/marketing/landing/hero-cleaners.png"
          />
        </div>
      </div>

      <HeroMetricsAnchor />
    </div>
  );
}

/**
 * Frame 29 composition (desktop hover swap). Purple field, waves, cleaner, split copy.
 */
function AlternateHero({ bookingHref }: { bookingHref: string }) {
  return (
    <div
      className="relative isolate h-full min-h-full rounded-[20px] sm:rounded-[38px]"
      style={{ backgroundColor: ALT_PURPLE }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[20px] sm:rounded-[38px]">
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          fill
          priority
          sizes="(min-width: 1551px) 1551px, 100vw"
          src={HERO_ALT_WAVES}
        />

        <Image
          alt="CleanScape cleaner giving a thumbs up"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_72%]"
          fill
          priority
          sizes="(min-width: 1551px) 1551px, 100vw"
          src={HERO_ALT_CLEANER}
        />

        <div className="absolute inset-0 z-10">
          <h2 className="absolute left-[5.5%] top-[16%] max-w-[36%] text-left text-[clamp(1.05rem,3.35vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:left-[7.5%] sm:top-[17%] sm:max-w-[34%]">
            Book Trusted Home{" "}
            <span style={{ color: ALT_GOLD }}>Cleaning</span> service in Minutes
          </h2>

          <div className="absolute right-[5.5%] top-[28%] flex max-w-[30%] flex-col items-end text-right sm:right-[7%] sm:top-[30%] sm:max-w-[23%]">
            <p className="text-pretty text-[clamp(0.62rem,1.05vw,0.875rem)] font-normal leading-[1.45] text-white">
              From residential and commercial cleaning to short-term rentals,
              exterior work and recovery support, book certified professionals,
              track every visit, and pay only after the job is complete.
            </p>
            <Link
              className="mt-3 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[0.9em] py-[0.55em] text-[clamp(0.625rem,0.85vw,0.72rem)] font-medium tracking-[-0.01em] text-[#1c133b] transition hover:brightness-110 sm:mt-3.5"
              href={bookingHref}
              style={{ backgroundColor: ALT_GOLD }}
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>

      <HeroMetricsAnchor />
    </div>
  );
}

/** Centered on the hero’s bottom edge; half the pill hangs outside the rounded frame. */
function HeroMetricsAnchor() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-[min(94%,780px)] -translate-x-1/2 translate-y-1/2 sm:w-[min(72%,960px)] lg:w-[min(68%,1040px)]">
      <div className="pointer-events-auto">
        <HeroMetrics />
      </div>
    </div>
  );
}

function HeroMetrics() {
  return (
    <div className="grid grid-cols-3 gap-[clamp(0.5rem,1.6vw,2rem)] rounded-[1.5rem] border border-[#c79c66] bg-[#1c133b] px-[clamp(0.75rem,2.4vw,3.25rem)] py-[clamp(0.85rem,1.7vw,1.5rem)] text-white sm:flex sm:items-center sm:justify-between sm:rounded-full">
      <Metric label={"Service\ncategories"} value="5" />
      <Metric label={"Services\navailable"} value="20+" />
      <Metric label={"Status\nvisibility"} value="Live" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[clamp(0.25rem,0.7vw,0.75rem)] text-center sm:flex-row sm:items-center sm:text-left">
      <p className="text-[clamp(1.25rem,3.2vw,2.75rem)] font-normal leading-none tracking-tight text-[#c79c66]">
        {value}
      </p>
      <p className="whitespace-pre-line text-[clamp(0.625rem,1.25vw,1.125rem)] font-normal leading-[1.2] text-white">
        {label}
      </p>
    </div>
  );
}
