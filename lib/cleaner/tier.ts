import type { CleanerTier } from "@/types/cleaner";

export const TIER_COLORS: Record<CleanerTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  rose_gold: "#B76E79",
  elite: "#9B59B6",
};

export const TIER_REQUIREMENTS = {
  bronze: { jobs: 0, rating: 0, score: -20 },
  silver: { jobs: 0, rating: 0, score: 0 },
  gold: { jobs: 0, rating: 0, score: 50 },
  rose_gold: { jobs: 0, rating: 0, score: 150 },
  elite: { jobs: 0, rating: 0, score: 150 },
} satisfies Record<CleanerTier, { jobs: number; rating: number; score: number }>;

export function nextTier(tier: CleanerTier) {
  const order: CleanerTier[] = ["bronze", "silver", "gold", "rose_gold"];
  const normalizedTier = tier === "elite" ? "rose_gold" : tier;

  return order[Math.min(order.indexOf(normalizedTier) + 1, order.length - 1)];
}

export function cleanerTierLabel(tier: CleanerTier) {
  if (tier === "rose_gold") return "Rose Gold";
  if (tier === "elite") return "Elite";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
