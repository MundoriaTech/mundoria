"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const HERO_SWAP_MS = 4000;

const HERO_ALT_CLEANER = "/images/marketing/landing/hero-alt-cleaner.png";
const HERO_ALT_WAVES = "/images/marketing/landing/hero-alt-waves.png";

const ALT_PURPLE = "#291845";
const ALT_GOLD = "#c79c66";

/** Clears the top half of the metrics pill so images sit flush on it without being covered. */
const METRICS_CLEARANCE = "pb-8 sm:pb-9 lg:pb-10";
const METRICS_CLEARANCE_PX = 40; // keep in sync with bottom on desktop cleaner

export function HeroSection({ bookingHref }: { bookingHref: string }) {
  const [variant, setVariant] = useState<"default" | "alt">("default");
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    if (canHover) {
      if (!hovered) {
        setVariant("default");
        return;
      }
      if (reduceMotion) {
        setVariant("alt");
        return;
      }
      setVariant("alt");
      const id = window.setInterval(() => {
        setVariant((current) => (current === "default" ? "alt" : "default"));
      }, HERO_SWAP_MS);
      return () => window.clearInterval(id);
    }

    const node = sectionRef.current;
    if (!node || reduceMotion) return;

    let intervalId: number | undefined;
    const start = () => {
      if (intervalId != null) return;
      setVariant("alt");
      intervalId = window.setInterval(() => {
        setVariant((current) => (current === "default" ? "alt" : "default"));
      }, HERO_SWAP_MS);
    };
    const stop = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
      setVariant("default");
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      stop();
      observer.disconnect();
    };
  }, [hovered]);

  return (
    <section
      ref={sectionRef}
      className="px-3 pb-12 pt-2 min-[380px]:px-4 sm:px-8 sm:pb-16"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative mx-auto w-full max-w-[1551px] pb-10 sm:pb-12 lg:pb-11">
        {/*
          Mobile: CSS grid stack — both heroes contribute height (no absolute clip).
          Desktop: shared aspect box with height cap.
        */}
        <div
          className={cn(
            "relative w-full",
            "max-lg:grid max-lg:[&>*]:col-start-1 max-lg:[&>*]:row-start-1",
            "lg:aspect-[1552/953] lg:max-h-[540px] xl:max-h-[580px]",
          )}
        >
          <div
            aria-hidden={variant !== "default"}
            className={cn(
              "transition-opacity duration-700 ease-in-out",
              "max-lg:relative lg:absolute lg:inset-0",
              variant === "default"
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0",
            )}
          >
            <DefaultHero bookingHref={bookingHref} />
          </div>

          <div
            aria-hidden={variant !== "alt"}
            className={cn(
              "transition-opacity duration-700 ease-in-out",
              "max-lg:relative lg:absolute lg:inset-0",
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
    <div className="relative isolate flex h-auto flex-col rounded-[20px] bg-white px-3 min-[380px]:px-5 sm:rounded-[38px] sm:px-10 sm:pt-2 lg:h-full lg:px-12 lg:pt-1">
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

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col rounded-[20px] sm:rounded-[38px]",
          METRICS_CLEARANCE,
        )}
      >
        <div className="mx-auto flex w-full max-w-[767px] shrink-0 flex-col items-center pt-5 text-center sm:pt-6 lg:pt-7">
          <h1 className="text-balance text-[1.625rem] font-medium leading-[1.08] tracking-[-0.04em] text-[#1c133b] min-[380px]:text-[2rem] sm:text-4xl lg:text-[clamp(1.75rem,2.4vw,2.75rem)]">
            Book Trusted Home Cleaning service in Minutes
          </h1>
          <p className="mx-auto mt-2 max-w-[550px] text-pretty text-[13px] font-normal leading-5 text-[#1c133b] sm:mt-3 sm:text-[14px] sm:leading-[21px] lg:mt-2 lg:text-[clamp(0.8125rem,1.1vw,0.875rem)]">
            From residential and commercial cleaning to short-term rentals,
            exterior work and recovery support, book certified professionals,
            track every visit, and pay only after the job is complete.
          </p>
          <Link
            className="mt-3 inline-flex h-[29px] items-center justify-center rounded-2xl bg-[#1c133b] px-5 text-[12px] font-medium text-[#e6e5f3] transition hover:bg-[#1c133b]/90 sm:mt-4 lg:mt-3"
            href={bookingHref}
          >
            Book a Service
          </Link>
        </div>

        <div className="relative mx-auto mt-4 w-full max-w-[980px] sm:mt-5 lg:mt-2 lg:min-h-0 lg:flex-1">
          <Image
            alt="CleanScape cleaning professionals"
            className="mx-auto h-auto w-full object-contain object-bottom lg:hidden"
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
            sizes="(min-width: 1280px) 980px, 70vw"
            src="/images/marketing/landing/hero-cleaners.png"
          />
        </div>
      </div>

      <HeroMetricsAnchor />
    </div>
  );
}

function AlternateHero({ bookingHref }: { bookingHref: string }) {
  return (
    <div
      className="relative isolate flex h-auto min-h-full flex-col rounded-[20px] sm:rounded-[38px] lg:h-full"
      style={{ backgroundColor: ALT_PURPLE }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] sm:rounded-[38px]">
        <Image
          alt=""
          aria-hidden
          className="object-cover object-center"
          fill
          priority
          sizes="(min-width: 1551px) 1551px, 100vw"
          src={HERO_ALT_WAVES}
        />
      </div>

      {/* Mobile stacked — intrinsic image (never clipped by fill/scale hacks) */}
      <div
        className={cn(
          "relative z-10 flex flex-col px-4 pt-5 min-[380px]:px-5 lg:hidden",
          METRICS_CLEARANCE,
        )}
      >
        <h2 className="text-balance text-left text-[1.5rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white min-[380px]:text-[1.65rem]">
          Book Trusted Home{" "}
          <span style={{ color: ALT_GOLD }}>Cleaning</span> service in Minutes
        </h2>
        <p className="mt-3 max-w-md text-pretty text-left text-[13px] font-normal leading-5 text-white/95">
          From residential and commercial cleaning to short-term rentals,
          exterior work and recovery support, book certified professionals,
          track every visit, and pay only after the job is complete.
        </p>
        <Link
          className="mt-3 inline-flex w-fit items-center justify-center rounded-full px-4 py-2 text-[12px] font-medium text-[#1c133b] transition hover:brightness-110"
          href={bookingHref}
          style={{ backgroundColor: ALT_GOLD }}
        >
          Book a Service
        </Link>

        <div className="relative mt-4 w-full">
          <Image
            alt="CleanScape cleaner giving a thumbs up"
            className="mx-auto h-auto w-full object-contain object-bottom"
            height={900}
            priority
            sizes="92vw"
            src={HERO_ALT_CLEANER}
            width={1200}
          />
        </div>
      </div>

      {/* Desktop: Frame 29 — cleaner centered, full asset visible, sits on metrics */}
      <div className="absolute inset-0 z-10 hidden lg:block">
        <div
          className="pointer-events-none absolute inset-x-[10%] top-0 lg:inset-x-[12%]"
          style={{ bottom: METRICS_CLEARANCE_PX }}
        >
          <Image
            alt="CleanScape cleaner giving a thumbs up"
            className="object-contain object-bottom"
            fill
            priority
            sizes="900px"
            src={HERO_ALT_CLEANER}
          />
        </div>

        <h2 className="absolute left-[7.5%] top-[17%] max-w-[34%] text-left text-[clamp(1.75rem,3.2vw,3.15rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
          Book Trusted Home{" "}
          <span style={{ color: ALT_GOLD }}>Cleaning</span> service in Minutes
        </h2>

        <div className="absolute right-[7%] top-[30%] flex max-w-[23%] flex-col items-end text-right">
          <p className="text-pretty text-[clamp(0.75rem,1.05vw,0.875rem)] font-normal leading-[1.45] text-white">
            From residential and commercial cleaning to short-term rentals,
            exterior work and recovery support, book certified professionals,
            track every visit, and pay only after the job is complete.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2 text-[clamp(0.65rem,0.95vw,0.75rem)] font-medium text-[#1c133b] transition hover:brightness-110"
            href={bookingHref}
            style={{ backgroundColor: ALT_GOLD }}
          >
            Book a Service
          </Link>
        </div>
      </div>

      <HeroMetricsAnchor />
    </div>
  );
}

/** Centered on the container’s bottom edge; half the pill hangs outside. */
function HeroMetricsAnchor() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-[min(92%,640px)] -translate-x-1/2 translate-y-1/2 sm:w-[min(78%,780px)] lg:w-[min(72%,900px)]">
      <div className="pointer-events-auto">
        <HeroMetrics />
      </div>
    </div>
  );
}

function HeroMetrics() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-[#c79c66] bg-[#1c133b] px-4 py-2.5 text-white min-[400px]:gap-4 min-[400px]:px-5 sm:gap-6 sm:px-8 sm:py-4 lg:gap-8 lg:px-11 lg:py-5">
      <Metric label={"Service\ncategories"} value="5" />
      <Metric label={"Services\navailable"} value="20+" />
      <Metric label={"Status\nvisibility"} value="Live" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 text-center sm:flex-row sm:items-center sm:gap-2 sm:text-left lg:gap-2.5">
      <p className="text-xl font-normal leading-none tracking-tight text-[#c79c66] min-[400px]:text-2xl sm:text-3xl lg:text-4xl">
        {value}
      </p>
      <p className="whitespace-pre-line text-[8px] font-normal leading-[1.15] text-white min-[400px]:text-[9px] sm:text-sm sm:leading-[15px] lg:text-base lg:leading-[17px]">
        {label}
      </p>
    </div>
  );
}
