"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import {
  LANDING_NAV_PILL_H,
  LANDING_NAV_TOP,
} from "@/components/marketing/landing/landing-navbar";

/**
 * Frame 106 — three die-cut cards.
 * 1: original portrait; 2–3: Mask group (11)/(12).
 */
const HERO_STACK = [
  {
    alt: "CleanScape cleaner with spray bottle and brush",
    src: "/images/marketing/landing/hero-stack-1.png",
  },
  {
    alt: "CleanScape team cleaning a modern office",
    src: "/images/marketing/landing/hero-stack-2.png",
  },
  {
    alt: "CleanScape cleaner with supplies",
    src: "/images/marketing/landing/hero-stack-3.png",
  },
] as const;

const CARD_SIZE = "w-[72%]";
const HERO_BELOW_NAV = "3.75rem";

const CARD_HOLD_MS = 3200;
const CARD_TRANSITION_MS = 750;

const CARD_DEPTH_STYLE = [
  {
    transform: "translate(0%, 18%)",
    zIndex: 3,
    filter: "blur(0px)",
    opacity: 1,
  },
  {
    transform: "translate(14%, 4%)",
    zIndex: 2,
    filter: "blur(8px)",
    opacity: 0.95,
  },
  {
    transform: "translate(28%, 10%)",
    zIndex: 1,
    filter: "blur(12px)",
    opacity: 0.9,
  },
] as const;

/** Mobile: whole 3-card cluster centered as one unit (desktop styles unchanged). */
const CARD_DEPTH_STYLE_MOBILE = [
  {
    transform: "translate(-50%, 18%)",
    zIndex: 3,
    filter: "blur(0px)",
    opacity: 1,
  },
  {
    transform: "translate(calc(-50% + 12%), 4%)",
    zIndex: 2,
    filter: "blur(8px)",
    opacity: 0.95,
  },
  {
    transform: "translate(calc(-50% + 24%), 10%)",
    zIndex: 1,
    filter: "blur(12px)",
    opacity: 0.9,
  },
] as const;

/** Hero copy + cards; purple fill + texture that softens into the flat band below. */
export function HeroSection({ bookingHref }: { bookingHref: string }) {
  const navBlock = `calc(${LANDING_NAV_TOP} + ${LANDING_NAV_PILL_H})`;

  return (
    <section
      className="relative isolate overflow-x-clip"
      style={{
        backgroundColor: LANDING_PURPLE,
        marginTop: `calc(-1 * ${navBlock})`,
        paddingTop: `calc(${navBlock} + ${HERO_BELOW_NAV})`,
      }}
    >
      {/* Textured layer — full hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Image
          alt=""
          className="object-cover object-center opacity-100 mix-blend-soft-light"
          fill
          priority
          sizes="100vw"
          src="/images/marketing/landing/hero-purple-texture.png"
        />
      </div>
      {/* Solid purple wash so texture fades out at the bottom into the next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] z-[1]"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent 0%, ${LANDING_PURPLE} 100%)`,
        }}
      />
      <div className="relative z-10 mx-auto grid w-full max-w-[1320px] items-center gap-8 px-4 pb-16 sm:gap-10 sm:px-6 sm:pb-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8 lg:px-8 lg:pb-40 lg:pt-2 xl:gap-6 xl:px-10 xl:pb-44">
        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center lg:mx-0 lg:max-w-[34rem] lg:items-start lg:justify-self-start lg:pb-8 lg:pl-0 lg:text-left xl:-ml-2">
          <h1 className="text-balance text-[2.05rem] font-bold leading-[1.1] tracking-[-0.04em] text-white min-[400px]:text-[2.4rem] sm:text-[2.85rem] lg:text-[clamp(2.65rem,3.5vw,3.4rem)]">
            Book Trusted Home
            <br />
            Cleaning service in Minutes
          </h1>
          <p className="mt-5 max-w-[30rem] text-pretty text-[15px] font-normal leading-6 text-white/95 sm:mt-6 sm:text-[17px] sm:leading-7">
            Find cleaning jobs near you, choose when you work, and get paid for
            the services you provide.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 w-auto items-center justify-center rounded-full bg-[#ff5274] px-8 text-[15px] font-semibold text-white transition duration-200 hover:scale-[1.03] hover:bg-[#ff3d63] active:scale-[0.98] sm:mt-10 sm:min-h-[3.25rem] sm:px-9"
            href={bookingHref}
          >
            Book a Service
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[400px] lg:mx-0 lg:mb-2 lg:ml-auto lg:max-w-none lg:justify-self-end xl:max-w-[620px]">
          <HeroImageStack />
        </div>
      </div>
    </section>
  );
}

function HeroImageStack() {
  const [front, setFront] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(motion.matches);
    syncMotion();
    motion.addEventListener("change", syncMotion);

    const desktop = window.matchMedia("(min-width: 1024px)");
    const syncViewport = () => setIsMobile(!desktop.matches);
    syncViewport();
    desktop.addEventListener("change", syncViewport);

    return () => {
      motion.removeEventListener("change", syncMotion);
      desktop.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setFront((current) => (current + 1) % HERO_STACK.length);
    }, CARD_HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const depthStyles = isMobile ? CARD_DEPTH_STYLE_MOBILE : CARD_DEPTH_STYLE;

  return (
    <div
      aria-live="polite"
      className="relative mx-auto aspect-[860/780] w-full max-w-[320px] translate-x-0 min-[400px]:max-w-[360px] sm:max-w-[420px] lg:ml-auto lg:mr-0 lg:max-w-[580px] lg:translate-x-16 xl:translate-x-24"
    >
      {HERO_STACK.map((card, index) => {
        const depth = (index - front + HERO_STACK.length) % HERO_STACK.length;
        const style = depthStyles[depth];
        const isFront = depth === 0;

        return (
          <div
            className={`absolute top-0 aspect-square ${CARD_SIZE} ${
              isMobile ? "left-1/2" : "left-0"
            }`}
            key={card.src}
            style={{
              transform: style.transform,
              zIndex: style.zIndex,
              opacity: style.opacity,
              filter: isFront
                ? "drop-shadow(0 28px 40px rgba(0,0,0,0.45))"
                : "drop-shadow(0 18px 32px rgba(0,0,0,0.35))",
              transition: reduceMotion
                ? undefined
                : `transform ${CARD_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${CARD_TRANSITION_MS}ms ease`,
            }}
          >
            <div
              className="relative h-full w-full"
              style={{
                filter: isFront ? undefined : style.filter,
                transition: reduceMotion
                  ? undefined
                  : `filter ${CARD_TRANSITION_MS}ms ease`,
              }}
            >
              <Image
                alt={card.alt}
                className="object-contain object-center"
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 420px, 80vw"
                src={card.src}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
