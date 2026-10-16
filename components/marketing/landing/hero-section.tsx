"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  LANDING_NAV_PILL_H,
  LANDING_NAV_TOP,
} from "@/components/marketing/landing/nav-metrics";

const HERO_VIDEO = "/images/marketing/landing/hero-living-room.mp4";
const HERO_POSTER = "/images/marketing/landing/hero-living-room-poster.jpg";

/** Full-bleed living-room film, with the booking line set on the left. */
export function HeroSection({ bookingHref }: { bookingHref: string }) {
  const navBlock = `calc(${LANDING_NAV_TOP} + ${LANDING_NAV_PILL_H})`;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  return (
    <section
      className="relative isolate min-h-[28rem] overflow-hidden sm:min-h-[36rem] lg:min-h-[52rem]"
      style={{ marginTop: `calc(-1 * ${navBlock})` }}
    >
      {reduceMotion ? (
        <Image
          alt=""
          className="object-cover object-[64%_38%] sm:object-[50%_42%] lg:object-[70%_center]"
          fill
          priority
          sizes="100vw"
          src={HERO_POSTER}
        />
      ) : (
        <video
          aria-hidden
          autoPlay
          className="absolute inset-0 h-full w-full object-cover object-[64%_38%] sm:object-[50%_42%] lg:object-[70%_center]"
          loop
          muted
          playsInline
          poster={HERO_POSTER}
          preload="metadata"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* On a narrow screen the crop sits over the sofa, so the wash covers more of the frame. */}
      <div
        aria-hidden
        className="absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(28, 19, 59, 0.55) 0%, rgba(28, 19, 59, 0.28) 42%, rgba(63, 53, 98, 0.15) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(32, 24, 58, 0.78) 0%, rgba(42, 35, 72, 0.42) 28%, rgba(42, 35, 72, 0.12) 52%, rgba(42, 35, 72, 0) 68%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[46%] sm:h-[52%]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(63, 53, 98, 0) 0%, rgba(63, 53, 98, 0.18) 28%, rgba(63, 53, 98, 0.72) 62%, #3F3562 100%)",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-center">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 xl:px-10">
          <h1 className="max-w-[18rem] text-balance text-[clamp(1.85rem,7.4vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.045em] text-white sm:max-w-[34rem]">
            Book Trusted
            <br />
            Home Cleaning
            <br />
            Service in Minutes
          </h1>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#c79c66] px-6 text-sm font-semibold text-[#1c133b] transition hover:brightness-95 touch-manipulation sm:mt-8 sm:h-12 sm:px-8 sm:text-[15px]"
            href={bookingHref}
          >
            Book now
          </Link>
        </div>
      </div>
    </section>
  );
}
