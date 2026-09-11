"use client";

import { useEffect, useState } from "react";

import { LazyImage } from "@/components/shared/lazy-image";

type CategoryLoopMediaProps = {
  alt: string;
  posterSrc: string;
  videoSrc?: string;
};

/** Colour-coded cleaning scene loop with still poster fallback. */
export function CategoryLoopMedia({
  alt,
  posterSrc,
  videoSrc,
}: CategoryLoopMediaProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const showVideo = Boolean(videoSrc) && !reduceMotion;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1c133b]/10">
      <LazyImage
        alt={alt}
        className={`object-cover transition duration-500 group-hover:scale-[1.03] ${
          showVideo && videoReady ? "opacity-0" : "opacity-100"
        }`}
        fill
        sizes="(min-width: 1024px) 295px, (min-width: 480px) 45vw, 92vw"
        src={posterSrc}
      />

      {showVideo ? (
        <video
          aria-hidden
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          loop
          muted
          onPlaying={() => setVideoReady(true)}
          playsInline
          poster={posterSrc}
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1c133b]/20 via-transparent to-transparent"
      />
    </div>
  );
}
