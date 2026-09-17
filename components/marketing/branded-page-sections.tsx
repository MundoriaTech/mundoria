import Link from "next/link";
import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { cn } from "@/lib/utils";

/** Soft cream page wash used across secondary marketing pages. */
export function BrandedPageWash({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#faf8ff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 12% 0%, rgba(244, 176, 140, 0.35) 0%, transparent 58%), radial-gradient(ellipse 50% 40% at 88% 8%, rgba(232, 188, 140, 0.28) 0%, transparent 52%), linear-gradient(180deg, #f7f2ea 0%, #faf8ff 72%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function BrandedSection({
  children,
  className,
  tone = "plain",
}: {
  children: ReactNode;
  className?: string;
  tone?: "plain" | "cream" | "lavender";
}) {
  return (
    <section
      className={cn(
        "relative px-4 py-12 sm:px-8 sm:py-16 lg:px-12",
        tone === "cream" && "bg-[#f7f2ea]/70",
        tone === "lavender" && "bg-[#f3eef8]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function BrandedCardLink({
  description,
  href,
  label,
  meta,
}: {
  description?: string;
  href: string;
  label: string;
  meta?: string;
}) {
  return (
    <ScrollReveal>
      <Link
        className="group flex h-full flex-col rounded-[1.35rem] border border-[#e4daf5]/80 bg-white/85 p-5 shadow-[0_10px_28px_rgba(49,44,121,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(49,44,121,0.12)] sm:p-6"
        href={href}
      >
        {meta ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#823fb2]">
            {meta}
          </p>
        ) : null}
        <h3 className="mt-2 text-[1.05rem] font-semibold tracking-[-0.02em] text-[#1c133b] transition group-hover:text-[#6a45b8] sm:text-lg">
          {label}
        </h3>
        {description ? (
          <p className="mt-2 flex-1 text-sm leading-6 text-[#5a5470]">
            {description}
          </p>
        ) : null}
      </Link>
    </ScrollReveal>
  );
}

export function BrandedCtaBand({
  body,
  href,
  label,
  title,
}: {
  body: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-8 sm:py-16">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(115deg, #1c133b 0%, #312c79 48%, #823fb2 100%)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <h2 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/75">{body}</p>
        </div>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#1c133b] transition hover:bg-[#e8e0f9]"
          href={href}
        >
          {label}
        </Link>
      </div>
    </section>
  );
}
