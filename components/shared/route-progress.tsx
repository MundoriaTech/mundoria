"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Give up and hide the bar if a navigation never completes. */
const STALL_MS = 10_000;

/**
 * Thin progress bar along the top of the viewport while the App Router
 * fetches the next page. Starts on same-origin link clicks and browser
 * back/forward, finishes when the pathname changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (hash or query only) does not change the pathname, so the
      // bar would never complete. Skip it.
      if (url.pathname === window.location.pathname) return;
      setActive(true);
    }

    function onPopState() {
      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(false), STALL_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          animate={{ width: "88%" }}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[120] h-[3px] rounded-r-full bg-gradient-to-r from-brand-purple via-brand-violet to-brand-peach shadow-[0_0_12px_rgba(106,69,184,0.45)]"
          exit={{
            opacity: 0,
            transition: { duration: 0.32, ease: "easeOut" },
            width: "100%",
          }}
          initial={{ opacity: 1, width: "0%" }}
          key="route-progress"
          transition={{ duration: 7, ease: [0.08, 0.82, 0.17, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );
}
