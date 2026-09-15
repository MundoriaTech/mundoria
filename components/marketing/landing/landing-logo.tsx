import Link from "next/link";

import { cn } from "@/lib/utils";

type LandingLogoProps = {
  className?: string;
  href?: string;
  /** Kept for call-site compatibility; unused while the mark is text-only. */
  priority?: boolean;
  /** Default for light surfaces; onDark for navy / inverted sections. */
  variant?: "default" | "onDark";
};

/** Temporary text wordmark until the Mundoria logo artwork is ready. */
export function LandingLogo({
  className,
  href,
  variant = "default",
}: LandingLogoProps) {
  const wordmark = (
    <span
      className={cn(
        "inline-flex items-center text-[1.35rem] font-black tracking-[-0.06em] sm:text-[1.55rem]",
        variant === "onDark" ? "text-white" : "text-[#1c133b]",
        className,
      )}
    >
      Mundoria
    </span>
  );

  if (!href) {
    return wordmark;
  }

  return (
    <Link aria-label="Mundoria home" className="shrink-0" href={href}>
      {wordmark}
    </Link>
  );
}
