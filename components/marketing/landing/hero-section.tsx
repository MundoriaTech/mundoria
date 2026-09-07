"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const HERO_SWAP_MS = 4000;

/** Transparent PNG layers that composite to Frame 29 (minus live HTML copy). */
const HERO_ALT_CLEANER = "/images/marketing/landing/hero-alt-cleaner.png";
const HERO_ALT_WAVES = "/images/marketing/landing/hero-alt-waves.png";

/** Sampled from Frame 29 purple field. */
const ALT_PURPLE = "#291845";
const ALT_GOLD = "#c79c66";

/** Frame 29 design canvas — one layout, scaled to every viewport. */
const DESIGN_W = 1551;
const DESIGN_H = 953;
/** Cap scaled height on large screens so the hero doesn’t tower. */
const MAX_SCALED_H = 560;

export function HeroSection({ bookingHref }: { bookingHref: string }) {
  const [variant, setVariant] = useState<"default" | "alt">("default");
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const update = () => {
      const width = shell.clientWidth;
      if (width <= 0) return;
      const next = Math.min(width / DESIGN_W, MAX_SCALED_H / DESIGN_H);
      setScale(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

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
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => {
      stop();
      observer.disconnect();
    };
  }, [hovered]);

  const scaledH = DESIGN_H * scale;
  // Room for the metrics pill hanging off the bottom edge (scales with the frame).
  const metricsHang = Math.max(36, 56 * scale);

  return (
    <section
      ref={sectionRef}
      className="overflow-x-clip px-3 pt-2 min-[380px]:px-4 sm:px-8"
      style={{ paddingBottom: metricsHang + 24 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/*
        One Frame 29 canvas (1551×953), uniformly scaled to the viewport width.
        Mobile = desktop layout, just smaller — no separate mobile composition.
      */}
      <div className="relative mx-auto w-full max-w-[1551px]" ref={shellRef}>
        <div className="relative w-full" style={{ height: scaledH }}>
          <div
            className="absolute left-0 top-0"
            style={{
              width: DESIGN_W,
              height: DESIGN_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              aria-hidden={variant !== "default"}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
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
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                variant === "alt"
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0",
              )}
            >
              <AlternateHero bookingHref={bookingHref} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DefaultHero({ bookingHref }: { bookingHref: string }) {
  return (
    <div className="relative isolate flex h-full flex-col rounded-[38px] bg-white px-12 pt-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[38px]"
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[38px]">
        <div className="mx-auto flex w-full max-w-[767px] shrink-0 flex-col items-center pt-7 text-center">
          <h1 className="text-balance text-[44px] font-medium leading-[1.08] tracking-[-0.04em] text-[#1c133b]">
            Book Trusted Home Cleaning service in Minutes
          </h1>
          <p className="mx-auto mt-3 max-w-[550px] text-pretty text-[14px] font-normal leading-[21px] text-[#1c133b]">
            From residential and commercial cleaning to short-term rentals,
            exterior work and recovery support, book certified professionals,
            track every visit, and pay only after the job is complete.
          </p>
          <Link
            className="mt-4 inline-flex h-[29px] items-center justify-center rounded-2xl bg-[#1c133b] px-5 text-[12px] font-medium text-[#e6e5f3] transition hover:bg-[#1c133b]/90"
            href={bookingHref}
          >
            Book a Service
          </Link>
        </div>

        <div className="relative mx-auto mt-3 min-h-0 w-full max-w-[980px] flex-1">
          <Image
            alt="CleanScape cleaning professionals"
            className="object-contain object-bottom"
            fill
            priority
            sizes="980px"
            src="/images/marketing/landing/hero-cleaners.png"
          />
        </div>
      </div>

      <HeroMetricsAnchor />
    </div>
  );
}

/**
 * Frame 29 composition — fixed design coordinates; parent scale handles mobile.
 */
function AlternateHero({ bookingHref }: { bookingHref: string }) {
  return (
    <div
      className="relative isolate h-full min-h-full rounded-[38px]"
      style={{ backgroundColor: ALT_PURPLE }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[38px]">
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          fill
          priority
          sizes="1551px"
          src={HERO_ALT_WAVES}
        />

        <div className="pointer-events-none absolute inset-x-[18%] inset-y-[2%]">
          <Image
            alt="CleanScape cleaner giving a thumbs up"
            className="object-contain object-bottom"
            fill
            priority
            sizes="900px"
            src={HERO_ALT_CLEANER}
          />
        </div>

        <div className="absolute inset-0 z-10">
          <h2 className="absolute left-[7.5%] top-[17%] max-w-[34%] text-left text-[50px] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
            Book Trusted Home{" "}
            <span style={{ color: ALT_GOLD }}>Cleaning</span> service in Minutes
          </h2>

          <div className="absolute right-[7%] top-[30%] flex max-w-[23%] flex-col items-end text-right">
            <p className="text-pretty text-[14px] font-normal leading-[1.45] text-white">
              From residential and commercial cleaning to short-term rentals,
              exterior work and recovery support, book certified professionals,
              track every visit, and pay only after the job is complete.
            </p>
            <Link
              className="mt-4 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-5 py-2 text-[12px] font-medium tracking-[-0.01em] text-[#1c133b] transition hover:brightness-110"
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
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-[min(72%,900px)] -translate-x-1/2 translate-y-1/2">
      <div className="pointer-events-auto">
        <HeroMetrics />
      </div>
    </div>
  );
}

function HeroMetrics() {
  return (
    <div className="flex items-center justify-between gap-8 rounded-full border border-[#c79c66] bg-[#1c133b] px-11 py-5 text-white">
      <Metric label={"Service\ncategories"} value="5" />
      <Metric label={"Services\navailable"} value="20+" />
      <Metric label={"Status\nvisibility"} value="Live" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-left">
      <p className="text-4xl font-normal leading-none tracking-tight text-[#c79c66]">
        {value}
      </p>
      <p className="whitespace-pre-line text-base font-normal leading-[17px] text-white">
        {label}
      </p>
    </div>
  );
}
