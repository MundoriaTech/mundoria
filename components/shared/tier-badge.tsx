import { TIER_COLORS } from "@/lib/cleaner/tier";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

export function TierBadge({
  className,
  tier,
}: {
  className?: string;
  tier: CleanerTier;
}) {
  const darkText = tier !== "elite";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize",
        darkText ? "text-slate-950" : "text-white",
        className,
      )}
      style={{ backgroundColor: TIER_COLORS[tier] }}
    >
      {tier}
    </span>
  );
}
