import type { LandingReview } from "@/lib/marketing/landing-reviews";
import type { DirectoryReview } from "@/lib/seo/birmingham-directory";

function parseLocationReviewAuthor(author: string) {
  const match = author.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { area: match[2].trim(), name: match[1].trim() };
  }
  return { area: null as string | null, name: author.trim() };
}

/** Maps directory reviews into landing cards: stars, quote, name, service · place. */
export function directoryReviewsToLandingReviews(
  reviews: DirectoryReview[],
): LandingReview[] {
  return reviews.map((review, index) => {
    const { area, name } = parseLocationReviewAuthor(review.author);
    const service = review.service?.trim() || null;
    const detail =
      service && area
        ? `${service} · ${area}`
        : service || area || "Mundoria customer";

    return {
      detail,
      id: `location-review-${index}-${review.body.slice(0, 16).replace(/\s+/g, "-")}`,
      name,
      quote: review.body,
      rating: review.score,
    };
  });
}
