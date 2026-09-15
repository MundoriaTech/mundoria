"use client";

import { useEffect, useRef, useState } from "react";

import { LazyImage } from "@/components/shared/lazy-image";
import { cn } from "@/lib/utils";

type CategoryLoopMediaProps = {
  active: boolean;
  alt: string;
  /** Extra classes for the poster + video (e.g. framing shift inside the card). */
  mediaClassName?: string;
  posterSrc: string;
  videoSrc?: string;
};

/** Still poster by default; video plays while `active` (card hover/focus). */
export function CategoryLoopMedia({
  active,
  alt,
  mediaClassName,
  posterSrc,
  videoSrc,
}: CategoryLoopMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || reduceMotion) return;

    let cancelled = false;

    if (active) {
      void video
        .play()
        .then(() => {
          if (!cancelled) setPlaying(true);
        })
        .catch(() => {
          if (!cancelled) setPlaying(false);
        });
      return () => {
        cancelled = true;
      };
    }

    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Ignore until media is seekable.
    }
    setPlaying(false);

    return () => {
      cancelled = true;
    };
  }, [active, reduceMotion, videoSrc]);

  const canPlay = Boolean(videoSrc) && !reduceMotion;
  const showMotion = canPlay && active && playing;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1c133b]/10">
      <LazyImage
        alt={alt}
        className={cn(
          "object-cover transition duration-500",
          mediaClassName ?? "group-hover:scale-[1.03]",
          showMotion ? "opacity-0" : "opacity-100",
        )}
        fill
        quality={90}
        sizes="(min-width: 1024px) 295px, (min-width: 480px) 45vw, 92vw"
        src={posterSrc}
      />

      {canPlay ? (
        <video
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-500",
            mediaClassName ?? "group-hover:scale-[1.03]",
            showMotion ? "opacity-100" : "opacity-0",
          )}
          loop
          muted
          playsInline
          poster={posterSrc}
          preload="auto"
          ref={videoRef}
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
