export type LandingReview = {
  detail: string;
  id: string;
  name: string;
  quote: string;
  /** Star score (1 to 5) from the customer's own rating, when known. */
  rating?: number | null;
};
