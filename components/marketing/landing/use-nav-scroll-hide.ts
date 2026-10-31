"use client";

import { useEffect, useRef, useState } from "react";

const NAV_SCROLL_AT = 48;
/** Match Tailwind `lg`, scroll-hide only on desktop; mobile keeps the bar pinned. */
const DESKTOP_MIN_WIDTH = "(min-width: 1024px)";

/** Hide sticky nav on scroll down (desktop only); keep visible while `paused`. */
export function useLandingNavScrollHide(paused = false) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (paused) {
      setHidden(false);
      return;
    }

    const media = window.matchMedia(DESKTOP_MIN_WIDTH);

    const resetMobile = () => {
      setHidden(false);
      lastScrollY.current = window.scrollY;
    };

    const update = () => {
      if (!media.matches) {
        resetMobile();
        return;
      }

      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < NAV_SCROLL_AT) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };

    resetMobile();
    update();
    window.addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      media.removeEventListener("change", update);
    };
  }, [paused]);

  return hidden;
}
