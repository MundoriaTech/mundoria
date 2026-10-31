import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HowItWorksCluster } from "@/components/marketing/how-it-works-cluster";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { HOW_IT_WORKS_STEPS } from "@/lib/seo/marketing";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See how Mundoria booking works: choose a service, get a clear estimate, book securely and track the clean from match to checklist completion.",
  path: "/how-it-works",
  title: "How Mundoria Works | Mundoria",
});

export default function HowItWorksPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";

  return (
    <MarketingShell>
      <section
        className="relative isolate overflow-hidden"
        style={{
          backgroundColor: "#d7ceeb",
          backgroundImage:
            "radial-gradient(78% 88% at 0% 0%, #9a84d0 0%, rgba(164,143,212,0.72) 34%, rgba(164,143,212,0) 64%), linear-gradient(180deg, #c8b9e4 0%, #ddd4ef 100%)",
          marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})`,
        }}
      >
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-left mix-blend-overlay opacity-60"
          fill
          sizes="100vw"
          src="/images/marketing/landing/how-hero-texture.png"
        />

        <div
          className="relative mx-auto w-full max-w-[1320px] px-4 pb-16 sm:px-6 lg:hidden"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.5rem)` }}
        >
          <h1 className="max-w-sm text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#504477]">
            How
            <br />
            Mundoria
            <br />
            works
          </h1>
          <p className="mt-4 max-w-[17rem] text-sm leading-6 text-[#1a191d]">
            Mundoria is designed so customers never feel like they’re filling
            in an insurance form, tell us what you need, see a clear estimate,
            then book.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#733fb2] px-8 text-[15px] font-semibold text-white transition duration-200 hover:scale-[1.03] hover:bg-[#6434a0] active:scale-[0.98] touch-manipulation sm:min-h-[3.25rem] sm:px-9"
              href={bookingHref}
            >
              Book a Service
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#504477]/70 px-8 text-[15px] font-semibold text-[#504477] transition hover:bg-[#504477] hover:text-white touch-manipulation sm:min-h-[3.25rem] sm:px-9"
              href={cleanerHref}
            >
              Become a cleaner
            </Link>
          </div>
          <div className="relative mx-auto mt-8 aspect-[364/324] w-full max-w-[28rem]">
            <HowItWorksCluster />
          </div>
        </div>

        <div className="relative z-10 mx-auto hidden aspect-[1920/1003] w-full max-w-[1920px] lg:block">
          <div className="absolute inset-y-0 left-1/2 w-full max-w-[1320px] -translate-x-1/2">
          <div className="absolute left-8 top-[11%] flex h-[82%] w-[26rem] flex-col justify-center xl:left-10">
          <h1 className="font-semibold leading-none tracking-[-0.04em] text-[#504477] [font-size:clamp(2.4rem,3.95vw,4.75rem)]">
            How
            <br />
            Mundoria
            <br />
            works
          </h1>
          <p className="mt-5 leading-[1.45] text-[#1a191d] [font-size:clamp(0.85rem,1.02vw,1.22rem)]">
            Mundoria is designed so customers never feel like they’re filling
            in an insurance form, tell us what you need, see a clear estimate,
            then book.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#733fb2] px-8 text-[15px] font-semibold text-white transition duration-200 hover:scale-[1.03] hover:bg-[#6434a0] active:scale-[0.98] sm:min-h-[3.25rem] sm:px-9"
              href={bookingHref}
            >
              Book a Service
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#504477]/70 px-8 text-[15px] font-semibold text-[#504477] transition hover:bg-[#504477] hover:text-white sm:min-h-[3.25rem] sm:px-9"
              href={cleanerHref}
            >
              Become a cleaner
            </Link>
          </div>
          </div>
          <div className="absolute right-8 top-[15%] aspect-[784/699] h-[74%] translate-x-[7.1%] xl:right-10">
            <HowItWorksCluster />
          </div>
          </div>
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden py-16 pl-9 pr-4 sm:px-8 sm:py-24"
        style={{ backgroundColor: LANDING_PURPLE }}
      >
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center mix-blend-soft-light"
          fill
          sizes="100vw"
          src="/images/marketing/landing/hero-purple-texture.png"
        />
        <div className="relative z-10 mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-x-8 md:gap-y-10">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article
              className="relative flex min-h-[13.5rem] min-w-0 flex-col items-center px-8 pb-8 pt-8 text-center sm:px-10"
              key={step.title}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.75rem] border border-white/45"
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 calc(50% + 22px), 4px calc(50% + 22px), 4px calc(50% - 22px), 0 calc(50% - 22px))",
                }}
              />
              <p className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.75rem] font-semibold leading-none tracking-[0.06em] text-[#c79c66]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.02em] text-[#c79c66] sm:text-[1.4rem]">
                {step.title}
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-7 text-white/80">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f0f8] px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-sm">
              <h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]">
                From booking to cleaner confirmed
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5c5670]">
                After payment, your booking enters matching. Once a cleaner
                accepts, you see confirmation and live status through arrival
                and completion.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#6a45b8] px-5 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
              href={bookingHref}
            >
              Book a Service
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
