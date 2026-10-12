"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HOLD_MS = 3200;
const MOVE_MS = 900;

/** Clockwise around the cluster. The mark stays in the middle. */
const SLOTS = [
  { left: "38.52%", top: "7.73%", width: "26.4%", height: "29.61%" },
  { left: "70.03%", top: "18.6%", width: "22.96%", height: "25.75%" },
  { left: "63.27%", top: "51.5%", width: "25.13%", height: "28.18%" },
  { left: "32.14%", top: "65.67%", width: "24.36%", height: "27.32%" },
  { left: "6.38%", top: "27.9%", width: "27.04%", height: "30.33%" },
] as const;

const PHOTOS = [
  {
    alt: "Cleaners working in an office",
    src: "/images/marketing/landing/how-cluster-office.png",
  },
  {
    alt: "Cleaning supplies in a basket",
    src: "/images/marketing/landing/how-cluster-basket.png",
  },
  {
    alt: "Cleaner holding a bucket of supplies",
    src: "/images/marketing/landing/how-cluster-yellow.png",
  },
  {
    alt: "Cleaner with a cart of supplies",
    src: "/images/marketing/landing/how-cluster-cart.png",
  },
  {
    alt: "Cleaner with a spray bottle",
    src: "/images/marketing/landing/how-cluster-pink.png",
  },
] as const;

export function HowItWorksCluster() {
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % PHOTOS.length);
    }, HOLD_MS + MOVE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <>
      {PHOTOS.map((photo, index) => {
        const slot = SLOTS[(index + step) % SLOTS.length];
        return (
          <div
            className="absolute"
            key={photo.src}
            style={{
              ...slot,
              filter: "drop-shadow(4px 8px 12px rgba(0, 0, 0, 0.45))",
              transition: reduceMotion
                ? undefined
                : `left ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), top ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), height ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              zIndex: Math.round(parseFloat(slot.top)),
            }}
          >
            <Image
              alt={photo.alt}
              className="object-contain object-center"
              fill
              sizes="(min-width: 1024px) 280px, 40vw"
              src={photo.src}
            />
          </div>
        );
      })}
      <div
        className="absolute z-30"
        style={{
          left: "38.65%",
          top: "42.92%",
          width: "18.11%",
          height: "17.17%",
        }}
      >
        <Image
          alt=""
          className="object-contain object-center"
          fill
          sizes="160px"
          src="/images/marketing/landing/how-cluster-mark.png"
        />
      </div>
    </>
  );
}
