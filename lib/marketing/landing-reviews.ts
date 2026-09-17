export type LandingReview = {
  detail: string;
  id: string;
  name: string;
  quote: string;
};

/**
 * Curated marketing reviews for launch / soft launch.
 * Swap for live `ratings` once enough applied public reviews exist.
 */
export const landingReviewPlaceholders: LandingReview[] = [
  {
    detail: "Regular cleaning · Harborne",
    id: "review-maya",
    name: "Maya",
    quote:
      "Booked a fortnightly clean in a few minutes. Updates were clear and the checklist made the finish feel transparent — not a rushed wipe.",
  },
  {
    detail: "Short-let host · Jewellery Quarter",
    id: "review-daniel",
    name: "Daniel",
    quote:
      "Turnovers used to be a panic. Mundoria gives me the status trail I need before a guest arrives, every time.",
  },
  {
    detail: "Deep clean · Edgbaston",
    id: "review-aisha",
    name: "Aisha",
    quote:
      "Same-week deep clean before family stayed. The cleaner was punctual, careful, and the kitchen and bathrooms looked genuinely finished.",
  },
  {
    detail: "Office manager · City centre",
    id: "review-james",
    name: "James",
    quote:
      "Our studio stays presentable without me chasing updates. Straightforward booking for the team and consistent results.",
  },
  {
    detail: "End of tenancy · Moseley",
    id: "review-sarah",
    name: "Sarah",
    quote:
      "Checklist and photo finish before the inventory check. Made the agent handover far less stressful.",
  },
  {
    detail: "Airbnb host · Kings Heath",
    id: "review-priya",
    name: "Priya",
    quote:
      "Guest-ready standards are consistent now. I can see status in the app without messaging back and forth.",
  },
  {
    detail: "Moving home · Selly Oak",
    id: "review-tom",
    name: "Tom",
    quote:
      "Empty-property clean between moves. Clear price up front and the cleaner left it ready for the new keys.",
  },
  {
    detail: "Regular cleaning · Bournville",
    id: "review-fatima",
    name: "Fatima",
    quote:
      "Prefer the same cleaner when we can — communication stays in the app and the house always feels looked after.",
  },
  {
    detail: "One-off clean · Digbeth",
    id: "review-olivia",
    name: "Olivia",
    quote:
      "Needed a reset after builders. Mundoria matched quickly and the special-attention notes were actually followed.",
  },
];
