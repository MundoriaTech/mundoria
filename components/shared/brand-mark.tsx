import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const MARK_SRC = "/images/brand/cleanscape-mark.png";
const MARK_WIDTH = 135;
const MARK_HEIGHT = 190;

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-11 w-8 items-center justify-center",
        className,
      )}
    >
      <Image
        alt=""
        className="h-full w-full object-contain"
        height={MARK_HEIGHT}
        src={MARK_SRC}
        width={MARK_WIDTH}
      />
    </span>
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
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      aria-label="CleanScape home"
      className={cn("inline-flex items-center gap-2.5", className)}
      href={href}
    >
      <BrandMark className={cn("h-10 w-7", markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            "text-xl font-black lowercase tracking-[-0.06em] text-[#221f50]",
            wordmarkClassName,
          )}
        >
          cleanscape
        </span>
      ) : null}
    </Link>
  );
}
