import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HowItWorksCluster } from "@/components/marketing/how-it-works-cluster";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LANDING_PURPLE } from "@/components/marketing/landing/landing-purple-field";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { FAQ_LINKS, faqSectionHref } from "@/lib/seo/faq-links";
import {
  howItWorksPlanChanges,
  howItWorksReturning,
  howItWorksSteps,
} from "@/lib/seo/how-it-works";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

/** Marketing page: cached and refreshed every 5 minutes (rate-card changes included). */
export const revalidate = 300;

const linkClass =
  "font-semibold text-[#6a45b8] underline-offset-2 hover:underline";

export const metadata: Metadata = buildPageMetadata({
  description:
    "How booking a cleaner with Mundoria works in eight steps: see the price first, nothing charged at booking, vetted cleaners and free cancellation 24 hours ahead.",
  path: "/how-it-works",
  title: "How Mundoria Works: Book a Cleaner in Birmingham",
});

export default async function HowItWorksPage() {
  const steps = howItWorksSteps(await loadServicePricing());
  const planChanges = howItWorksPlanChanges();
  const returning = howItWorksReturning();
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";

  const url = absoluteUrl("/how-it-works");

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            description:
              "How to book a vetted independent cleaner in Birmingham with Mundoria, from choosing a service to paying after the clean.",
            name: "How to book a cleaner with Mundoria",
            step: steps.map((step, index) => ({
              "@type": "HowToStep",
              name: step.title,
              position: index + 1,
              text: step.body,
              url: `${url}#journey-heading`,
            })),
            url,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", item: absoluteUrl("/"), name: "Home", position: 1 },
              { "@type": "ListItem", item: url, name: "How it works", position: 2 },
            ],
          },
        ]}
      />
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
          <div className="max-w-sm text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#504477]">
            How
            <br />
            Mundoria
            <br />
            works
          </div>
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
            How Mundoria works
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
        aria-labelledby="journey-heading"
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
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2
            className="text-center text-[1.75rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.15rem]"
            id="journey-heading"
          >
            Your booking, step by step
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {steps.map((step, index) => (
              <li
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
                <p
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.75rem] font-semibold leading-none tracking-[0.06em] text-[#c79c66]"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.02em] text-[#c79c66] sm:text-[1.4rem]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-7 text-white/80">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex justify-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[#1c133b] transition hover:bg-[#f3eef8]"
              href={bookingHref}
            >
              Check prices and availability
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="plans-change-heading"
        className="bg-[#f4f0f8] px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-[1.9rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]"
            id="plans-change-heading"
          >
            If plans change
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#5c5670]">
            The same rules apply to every booking, wherever you are.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {planChanges.map((item) => (
              <article
                className="rounded-[1.35rem] border border-[#e4daf5] bg-white px-5 py-5 sm:px-6 sm:py-6"
                key={item.title}
              >
                <h3 className="text-base font-semibold text-[#1c133b]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5c5670] sm:text-[15px] sm:leading-7">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-[#5c5670]">
            More detail on{" "}
            <Link className={linkClass} href={FAQ_LINKS.cancellations}>
              cancellations
            </Link>
            ,{" "}
            <Link className={linkClass} href={FAQ_LINKS.payments}>
              payments
            </Link>
            ,{" "}
            <Link className={linkClass} href={faqSectionHref("safety")}>
              cleaner checks and insurance
            </Link>{" "}
            and{" "}
            <Link className={linkClass} href={faqSectionHref("problems")}>
              problems after a clean
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        aria-labelledby="returning-heading"
        className="bg-white px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <h2
                className="text-[1.9rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-[2.15rem]"
                id="returning-heading"
              >
                For returning customers
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5c5670]">
                Regular cleaning without a contract.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#6a45b8] px-5 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
              href={bookingHref}
            >
              Check prices and availability
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {returning.map((item) => (
              <article
                className="rounded-[1.35rem] border border-[#e4daf5] bg-[#faf8ff] px-5 py-5 sm:px-6 sm:py-6"
                key={item.title}
              >
                <h3 className="text-base font-semibold text-[#1c133b]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5c5670] sm:text-[15px] sm:leading-7">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
