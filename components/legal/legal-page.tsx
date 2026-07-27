import Image from "next/image";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

export interface LegalSection {
  body?: string;
  bullets?: string[];
  title: string;
}

export function LegalPage({
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
    <main className="min-h-screen bg-[#f7f5ff] text-[#221f50]">
      <header className="border-b border-[#dedbfd] bg-white/90 px-5 py-5 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <Image
              alt="CleanScape"
              className="h-auto w-40"
              height={46}
              priority
              src="/images/brand/cleanscape-logo.png"
              width={203}
            />
          </Link>
          <Link
            className="rounded-full bg-[#221f50] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#37306c]"
            href="/signup"
          >
            Book now
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="rounded-[2.25rem] bg-[#221f50] p-7 text-white shadow-2xl shadow-[#221f50]/15 sm:p-10">
          <BrandMark className="h-14 w-14" />
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.24em] text-[#ffc79f]">
            Last updated {lastUpdated}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
            {intro}
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <section
              className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-6 shadow-sm sm:p-8"
              key={section.title}
            >
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {section.title}
              </h2>
              {section.body ? (
                <p className="mt-4 leading-8 text-[#4e486e]">{section.body}</p>
              ) : null}
              {section.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-[#4e486e]">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {children ? <div className="mt-5">{children}</div> : null}
      </section>
    </main>
  );
}
