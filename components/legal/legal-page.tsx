import Link from "next/link";

import {
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export interface LegalSection {
  body?: string;
  bullets?: string[];
  title: string;
}

export async function LegalPage({
  children,
  intro,
  lastUpdated,
  sections,
  title,
}: {
  children?: React.ReactNode;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <MarketingShell>
      <BrandedPageWash>
        <section className="relative px-4 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-16 lg:px-12">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] bg-[#1c133b] px-6 py-10 text-white shadow-[0_20px_50px_rgba(28,19,59,0.28)] sm:px-10 sm:py-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#f0a888]">
              Last updated {lastUpdated}
            </p>
            <h1 className="mt-4 text-[2.1rem] font-semibold tracking-[-0.045em] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
              {intro}
            </p>
          </div>
        </section>

        <BrandedSection className="!pt-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {sections.map((section) => (
              <section
                className="rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/90 p-6 shadow-[0_10px_28px_rgba(49,44,121,0.06)] sm:p-8"
                key={section.title}
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                  {section.title}
                </h2>
                {section.body ? (
                  <p className="mt-4 text-sm leading-7 text-[#5a5470] sm:text-[15px] sm:leading-8">
                    {section.body}
                  </p>
                ) : null}
                {section.bullets?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#5a5470]">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {children ? <div className="pt-2">{children}</div> : null}

            <div className="flex justify-center pt-6">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
                href="/"
              >
                Back to home
              </Link>
            </div>
          </div>
        </BrandedSection>
      </BrandedPageWash>
    </MarketingShell>
  );
}
