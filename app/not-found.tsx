import Image from "next/image";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata = {
  title: "Page not found",
};

export default async function NotFoundPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const homeHref = "/";

  return (
    <MarketingShell className="bg-[#f7f2fc]">
      <section
        className="relative overflow-hidden px-5 pb-20 sm:px-8 sm:pb-28"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.5rem)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#efe6ff] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#ffe8dc] blur-3xl"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#6a45b8]">
            Error 404
          </p>

          <div className="relative mt-6">
            <p
              aria-hidden
              className="select-none text-[7.5rem] font-bold leading-none tracking-[-0.08em] text-[#1c133b]/10 sm:text-[10rem]"
            >
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="motion-safe:animate-[cookie-bob_2.8s_ease-in-out_infinite]">
                <Image
                  alt=""
                  className="h-36 w-36 object-contain drop-shadow-[0_18px_30px_rgba(49,44,121,0.22)] sm:h-44 sm:w-44"
                  height={176}
                  priority
                  src="/images/booking/astronaut.png"
                  width={176}
                />
              </div>
            </div>
          </div>

          <h1 className="mt-4 max-w-xl text-balance text-[1.85rem] font-bold tracking-[-0.04em] text-[#1c133b] sm:text-[2.5rem] sm:leading-[1.1]">
            This page got a deep clean…
            <span className="block text-[#6a45b8]">and vanished.</span>
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base leading-7 text-[#5a5470] sm:text-lg">
            Our astronaut checked under the sofa, behind the fridge, and in the
            vacuum bag. Still no page. Shall we get you somewhere that actually
            exists?
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-6 text-base font-semibold text-white transition hover:bg-[#5a38a3] touch-manipulation"
              href={homeHref}
            >
              Beam me home
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#1c133b] bg-white px-6 text-base font-semibold text-[#1c133b] transition hover:bg-[#efe6ff] touch-manipulation"
              href={bookingHref}
            >
              Book a clean instead
            </Link>
          </div>

          <p className="mt-8 text-sm text-[#8b8798]">
            Or try{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/help"
            >
              Help
            </Link>
            ,{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/contact"
            >
              Contact
            </Link>
            , or{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/cleaning"
            >
              Services
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
