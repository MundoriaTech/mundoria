import Link from "next/link";

import { cn } from "@/lib/utils";

/** Temporary text wordmark until the Mundoria logo artwork is ready. */
export function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xl font-black tracking-[-0.06em]",
        variant === "onDark" ? "text-white" : "text-foreground",
        className,
      )}
    >
      Mundoria
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
  /** @deprecated Ignored — logo is text-only until artwork ships. */
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  void markClassName;

  return (
    <Link
      aria-label="Mundoria home"
      className={cn("inline-flex items-center", className)}
      href={href}
    >
      {showWordmark ? (
        <span
          className={cn(
            "text-xl font-black tracking-[-0.06em] text-foreground",
            wordmarkClassName,
          )}
        >
          Mundoria
        </span>
      ) : null}
    </Link>
  );
}
