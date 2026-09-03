export type LandingReview = {
  detail: string;
  id: string;
  name: string;
  quote: string;
};

/** Placeholder until public featured reviews are loaded from the database. */
export const landingReviewPlaceholders: LandingReview[] = [
  {
    detail: "Regular cleaning customer",
    id: "review-maya",
    name: "Maya",
    quote:
      "The clean felt effortless. I booked in a few minutes, got updates, and the checklist made the finish feel really transparent.",
  },
  {
    detail: "Airbnb host",
    id: "review-daniel",
    name: "Daniel",
    quote:
      "Turnovers used to be a panic. CleanScape gives me the status trail I need before a guest arrives.",
  },
  {
    detail: "Deep clean customer",
    id: "review-aisha",
    name: "Aisha",
    quote:
      "The cleaner was punctual, careful and professional. The whole flow felt calm instead of transactional.",
  },
  {
    detail: "Office manager",
    id: "review-james",
    name: "James",
    quote:
      "Our studio stays presentable without me chasing updates. The booking flow is straightforward for the team.",
  },
  {
    detail: "End of tenancy customer",
    id: "review-sarah",
    name: "Sarah",
    quote:
      "The checklist and photo finish gave us confidence before the inventory check. Exactly what we needed.",
  },
  {
    detail: "Short-term rental host",
    id: "review-priya",
    name: "Priya",
    quote:
      "Guest-ready standards are consistent now. I can see status without messaging back and forth.",
  },
];
