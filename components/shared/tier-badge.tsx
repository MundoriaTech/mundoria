import {
  cleanerTierLabel,
  medallionIconSrc,
  normalizeMedallionTier,
} from "@/lib/cleaner/tier";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

export function TierBadge({
  className,
  size = "md",
  tier,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  tier: CleanerTier;
}) {
  const visualTier = normalizeMedallionTier(tier);
  const label = cleanerTierLabel(tier);
  const iconSrc = medallionIconSrc(visualTier);

  const dims =
    size === "lg"
      ? { badge: "gap-2.5 px-3 py-2 text-sm", icon: "h-9 w-9" }
      : size === "sm"
        ? { badge: "gap-1.5 px-2 py-1 text-[11px]", icon: "h-5 w-5" }
        : { badge: "gap-2 px-2.5 py-1.5 text-xs", icon: "h-7 w-7" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#e4daf5] bg-white shadow-[0_4px_12px_rgba(28,19,59,0.06)]",
        dims.badge,
        className,
      )}
      title={`${label} medallion`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden className={cn("shrink-0", dims.icon)} src={iconSrc} />
      <span className="font-semibold tracking-wide text-[#1c133b]">{label}</span>
    </span>
  );
}
