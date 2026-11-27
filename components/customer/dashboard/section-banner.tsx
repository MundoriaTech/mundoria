import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The striped purple heading band used at the top of each dashboard section.
 * Shared so every customer (and cleaner) screen uses the same format.
 */
export function SectionBanner({
  children,
  className,
  title,
}: {
  children?: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[56px] items-center justify-between gap-3 overflow-hidden rounded-[14px] px-5 sm:min-h-[64px] sm:px-6",
        className,
      )}
      style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)",
        }}
      />
      <h2 className="relative m-0 text-[19px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[22px]">
        {title}
      </h2>
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}

/**
 * Lighter section title for detail pages — same hierarchy as SectionBanner
 * without the heavy striped purple band.
 */
export function SectionHeading({
  children,
  className,
  title,
}: {
  children?: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#1E1848] sm:text-[20px]">
        {title}
      </h2>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

/** Pill buttons that sit with a section banner. */
export const pillPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] sm:px-5 font-semibold text-white transition hover:brightness-110 xl:min-h-[52px] xl:px-6 xl:text-[16px]";
export const pillOutline =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#524096] px-4 text-[15px] font-semibold sm:px-5 text-[#524096] transition hover:bg-[#ECE8F6] xl:min-h-[52px] xl:px-6 xl:text-[16px]";
export const pillPrimaryStyle = {
  background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
} as const;
