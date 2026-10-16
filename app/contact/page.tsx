import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Contact Mundoria — apply as a cleaner, reach the team for press, or open chat for help with booking and your account.",
  path: "/contact",
  title: "Contact us | Mundoria",
});

export default function ContactPage() {
  const configured = hasSupabasePublicConfig();
  const applyHref = configured ? "/signup/cleaner" : "/setup";

  return (
    <MarketingShell>
      <section className="bg-white px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[2.75rem] font-semibold leading-none tracking-[-0.04em] text-[#c79c66] sm:text-[3.5rem]">
            Contact us
          </h1>

          <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-14">
            <div>
              <p className="text-pretty text-base leading-7 text-[#1c133b] sm:text-[1.05rem] sm:leading-8">
                Are you a{" "}
                <span className="font-semibold">
                  cleaner or independent cleaning professional
                </span>{" "}
                and you want to work with Mundoria?
              </p>
              <Link
                className="mt-6 inline-flex h-12 min-w-[10.5rem] items-center justify-center rounded-full bg-[#1c133b] px-8 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                href={applyHref}
              >
                Apply here
              </Link>
            </div>

            <div>
              <p className="text-pretty text-base leading-7 text-[#1c133b] sm:text-[1.05rem] sm:leading-8">
                Are you a{" "}
                <span className="font-semibold">journalist</span> or{" "}
                <span className="font-semibold">blogger</span>? We can help you
                understand how Mundoria supports customers and cleaners across
                the booking journey.
              </p>
              <p className="mt-5 text-pretty text-base leading-7 text-[#1c133b] sm:text-[1.05rem] sm:leading-8">
                Or you simply want to contact us to discuss or exchange ideas?
              </p>
              <ContactSupportButton
                className="mt-6 inline-flex h-12 min-w-[10.5rem] items-center justify-center rounded-full border border-[#1c133b] bg-white px-8 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f5fb]"
                label="Contact us"
                tab="home"
              />
            </div>

            <div>
              <p className="text-pretty text-base leading-7 text-[#5a5470] sm:text-[1.05rem] sm:leading-8">
                Looking for answers about booking, cleaners or your account?
                Visit the{" "}
                <Link
                  className="font-semibold text-[#1c133b] underline underline-offset-2 transition hover:text-[#c79c66]"
                  href="/help"
                >
                  Help Centre
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Breadcrumb"
        className="border-t border-[#ebe6f2] bg-white px-4 py-5 sm:px-8"
      >
        <ol className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-[#8b8798]">
          <li>
            <Link className="transition hover:text-[#1c133b]" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-[#1c133b]">Contact us</li>
        </ol>
      </nav>
    </MarketingShell>
  );
}
