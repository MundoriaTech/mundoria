"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MOBILE_MAX = "(max-width: 767px)";

export function LocationStickyBookBar({ bookingHref }: { bookingHref: string }) {
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(MOBILE_MAX);
    const sync = () => {
      const isMobile = mq.matches;
      setMobile(isMobile);
      if (isMobile) {
        document.documentElement.setAttribute("data-sticky-book", "");
      } else {
        document.documentElement.removeAttribute("data-sticky-book");
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.documentElement.removeAttribute("data-sticky-book");
    };
  }, []);

  return (
    <>
      {/* In-flow spacer so content isn’t hidden under the bar. */}
      <div aria-hidden className="h-20 md:hidden" />
      {mounted && mobile
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
              <div className="pointer-events-auto rounded-t-[1.5rem] border border-b-0 border-[#e4daf5] bg-white px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_32px_rgba(28,19,59,0.12)]">
                <div className="mx-auto max-w-lg">
                  <Link
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1c133b] text-sm font-semibold text-white transition hover:bg-[#1c133b]/90"
                    href={bookingHref}
                  >
                    Book a clean
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
