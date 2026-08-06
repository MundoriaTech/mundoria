import { Award, Crown, Medal, Shield, Sparkle } from "lucide-react";

import { cleanerTierLabel } from "@/lib/cleaner/tier";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

const TIER_VISUAL: Record<
  CleanerTier,
  {
    Icon: typeof Medal;
    ring: string;
    face: string;
    ink: string;
    gloss: string;
  }
> = {
  bronze: {
    Icon: Shield,
    ring: "from-[#8a5a2b] via-[#d4a574] to-[#6b4423]",
    face: "from-[#b87333] via-[#e8c09a] to-[#8c5a2b]",
    ink: "text-[#3d2412]",
    gloss: "from-white/50 to-transparent",
  },
  silver: {
    Icon: Medal,
    ring: "from-[#7a7f87] via-[#e8eaee] to-[#5c6168]",
    face: "from-[#a8adb6] via-[#f4f5f7] to-[#8b9098]",
    ink: "text-[#2c3038]",
    gloss: "from-white/70 to-transparent",
  },
  gold: {
    Icon: Award,
    ring: "from-[#b8860b] via-[#ffe566] to-[#8a6508]",
    face: "from-[#d4a017] via-[#fff1a8] to-[#b8860b]",
    ink: "text-[#4a3500]",
    gloss: "from-white/65 to-transparent",
  },
  rose_gold: {
    Icon: Sparkle,
    ring: "from-[#9a5a5f] via-[#f0c4b8] to-[#7a4048]",
    face: "from-[#c97b84] via-[#f7d4cb] to-[#a85c68]",
    ink: "text-[#4a2028]",
    gloss: "from-white/55 to-transparent",
  },
  elite: {
    Icon: Crown,
    ring: "from-[#2a2150] via-[#9b8cff] to-[#1a1438]",
    face: "from-[#4a3d8a] via-[#c4b5fd] to-[#31275f]",
    ink: "text-[#120c28]",
    gloss: "from-white/45 to-transparent",
  },
};

export function TierBadge({
  className,
  size = "md",
  tier,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  tier: CleanerTier;
}) {
  const visual = TIER_VISUAL[tier];
  const Icon = visual.Icon;
  const label = cleanerTierLabel(tier);

  const dims =
    size === "lg"
      ? { badge: "gap-2.5 px-3 py-2 text-sm", icon: "h-8 w-8", glyph: "h-4 w-4" }
      : size === "sm"
        ? { badge: "gap-1.5 px-2 py-1 text-[11px]", icon: "h-5 w-5", glyph: "h-2.5 w-2.5" }
        : { badge: "gap-2 px-2.5 py-1.5 text-xs", icon: "h-6 w-6", glyph: "h-3 w-3" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/10 bg-card shadow-sm",
        dims.badge,
        className,
      )}
      title={`${label} tier`}
    >
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-[1.5px] shadow-inner",
          dims.icon,
          visual.ring,
        )}
      >
        <span
          className={cn(
            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
            visual.face,
            visual.ink,
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b",
              visual.gloss,
            )}
          />
          <Icon aria-hidden className={cn("relative", dims.glyph)} strokeWidth={2.25} />
        </span>
      </span>
      <span className={cn("font-semibold tracking-wide", visual.ink)}>
        {label}
      </span>
    </span>
  );
}
