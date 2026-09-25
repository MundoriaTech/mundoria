import type { CleanerTier } from "@/types/cleaner";

export const TIER_COLORS: Record<CleanerTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  rose_gold: "#B76E79",
  elite: "#9B59B6",
};

/** Public medallion ladder shown to cleaners (Elite maps onto Rose Gold visually). */
export const TIER_LADDER = [
  "bronze",
  "silver",
  "gold",
  "rose_gold",
] as const satisfies readonly CleanerTier[];

export const TIER_REQUIREMENTS = {
  bronze: { jobs: 0, rating: 0, score: -20 },
  silver: { jobs: 0, rating: 0, score: 0 },
  gold: { jobs: 0, rating: 0, score: 50 },
  rose_gold: { jobs: 0, rating: 0, score: 150 },
  elite: { jobs: 0, rating: 0, score: 150 },
} satisfies Record<CleanerTier, { jobs: number; rating: number; score: number }>;

export function normalizeMedallionTier(tier: CleanerTier): CleanerTier {
  return tier === "elite" ? "rose_gold" : tier;
}

export function nextTier(tier: CleanerTier) {
  const normalizedTier = normalizeMedallionTier(tier);
  const index = TIER_LADDER.indexOf(
    normalizedTier as (typeof TIER_LADDER)[number],
  );
  return TIER_LADDER[Math.min(Math.max(index, 0) + 1, TIER_LADDER.length - 1)];
}

export function isTopMedallionTier(tier: CleanerTier) {
  const normalized = normalizeMedallionTier(tier);
  return normalized === "rose_gold";
}

export function cleanerTierLabel(tier: CleanerTier) {
  if (tier === "rose_gold") return "Rose Gold";
  if (tier === "elite") return "Elite";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
