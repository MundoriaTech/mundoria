"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SPRING } from "@/lib/motion";

const MOBILE_MAX = "(max-width: 767px)";

/** Mobile sticky book CTA for category / subcategory pages (WeCasa-style). */
export function LocationStickyBookBar({
  bookingHref,
  label = "Book my cleaning",
  secondary,
}: {
  bookingHref: string;
  label?: string;
  secondary?: string;
}) {
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
      <div aria-hidden className="h-[4.75rem] md:hidden" />
      {mounted && mobile
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
              <motion.div
                animate={{ y: 0 }}
                className="pointer-events-auto rounded-t-[1.5rem] border border-b-0 border-brand-lavender bg-white px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_32px_rgba(28,19,59,0.12)]"
                initial={{ y: "110%" }}
                transition={{ ...SPRING.gentle, delay: 0.4 }}
              >
                <div className="mx-auto max-w-lg">
                  <Link
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-ink text-sm font-semibold text-white transition hover:bg-brand-ink/90"
                    href={bookingHref}
                  >
                    {label}
                  </Link>
                  {secondary ? (
                    <p className="mt-2 text-center text-[12px] font-medium text-brand-ink/55">
                      {secondary}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
