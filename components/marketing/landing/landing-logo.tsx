import Image from "next/image";
import Link from "next/link";

import {
  MUNDORIA_WORDMARK_HEIGHT,
  MUNDORIA_WORDMARK_SRC,
  MUNDORIA_WORDMARK_WIDTH,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

type LandingLogoProps = {
  className?: string;
  href?: string;
  priority?: boolean;
  /** Default for light surfaces; onDark lightens the artwork for navy / inverted sections. */
  variant?: "default" | "onDark";
};

export function LandingLogo({
  className,
  href,
  priority = false,
  variant = "default",
}: LandingLogoProps) {
  const wordmark = (
    <Image
      alt="Mundoria"
      className={cn(
        "h-7 w-auto sm:h-8",
        variant === "onDark" && "brightness-0 invert",
        className,
      )}
      height={MUNDORIA_WORDMARK_HEIGHT}
      priority={priority}
      src={MUNDORIA_WORDMARK_SRC}
      width={MUNDORIA_WORDMARK_WIDTH}
    />
  );

  if (!href) {
    return wordmark;
  }

  return (
    <Link
      aria-label="Mundoria home"
      className="inline-flex shrink-0 items-center"
      href={href}
    >
      {wordmark}
    </Link>
  );
}
