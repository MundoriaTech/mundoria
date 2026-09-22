import Image from "next/image";
import Link from "next/link";

import {
  MUNDORIA_WORDMARK_HEIGHT,
  MUNDORIA_WORDMARK_SRC,
  MUNDORIA_WORDMARK_WIDTH,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  return (
    <Image
      alt="Mundoria"
      className={cn(
        "h-7 w-auto",
        variant === "onDark" && "brightness-0 invert",
        className,
      )}
      height={MUNDORIA_WORDMARK_HEIGHT}
      src={MUNDORIA_WORDMARK_SRC}
      width={MUNDORIA_WORDMARK_WIDTH}
    />
  );
}

export function BrandLogo({
  className,
  href = "/",
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  href?: string;
  /** @deprecated Ignored — full wordmark image is used. */
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  void markClassName;

  if (!showWordmark) {
    return null;
  }

  return (
    <Link
      aria-label="Mundoria home"
      className={cn("inline-flex items-center", className)}
      href={href}
    >
      <Image
        alt="Mundoria"
        className={cn("h-7 w-auto", wordmarkClassName)}
        height={MUNDORIA_WORDMARK_HEIGHT}
        src={MUNDORIA_WORDMARK_SRC}
        width={MUNDORIA_WORDMARK_WIDTH}
      />
    </Link>
  );
}
