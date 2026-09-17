"use client";

import { useEffect, useRef, useState } from "react";

const NAV_SCROLL_AT = 48;

/** Hide sticky nav on scroll down; keep visible while `paused` (e.g. mobile menu open). */
export function useLandingNavScrollHide(paused = false) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (paused) {
      setHidden(false);
      return;
    }

    lastScrollY.current = window.scrollY;
    const update = () => {
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

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [paused]);

  return hidden;
}
