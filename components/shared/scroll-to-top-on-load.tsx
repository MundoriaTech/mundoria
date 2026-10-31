"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { softScrollToTop } from "@/lib/soft-scroll-to-top";

function isReload() {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === "reload";
}

/**
 * Soft scroll to top on refresh and client navigations.
 * Lets the browser restore position briefly on reload, then eases up , 
 * same gentle feel as page enter transitions.
 */
export function ScrollToTopOnLoad() {
  const pathname = usePathname();
  const skipPathScrollRef = useRef(true);

  useEffect(() => {
    // Allow the browser to restore scroll on reload so we can ease from there.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "auto";
    }

    const run = () => softScrollToTop();

    if (isReload()) {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || isReload()) {
        requestAnimationFrame(() => requestAnimationFrame(run));
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    if (skipPathScrollRef.current) {
      skipPathScrollRef.current = false;
      return;
    }
    softScrollToTop();
  }, [pathname]);

  return null;
}
