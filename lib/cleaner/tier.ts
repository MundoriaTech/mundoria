import type { CleanerTier } from "@/types/cleaner";

export const TIER_COLORS: Record<CleanerTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  elite: "#9B59B6",
};

export const TIER_REQUIREMENTS = {
  bronze: { jobs: 0, rating: 0, score: 0 },
  silver: { jobs: 20, rating: 4.2, score: 65 },
  gold: { jobs: 75, rating: 4.5, score: 80 },
  elite: { jobs: 200, rating: 4.8, score: 92 },
} satisfies Record<CleanerTier, { jobs: number; rating: number; score: number }>;

export function nextTier(tier: CleanerTier) {
  const order: CleanerTier[] = ["bronze", "silver", "gold", "elite"];
  return order[Math.min(order.indexOf(tier) + 1, order.length - 1)];
}
