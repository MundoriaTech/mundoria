import type { LandingReview } from "@/lib/marketing/landing-reviews";
import type { DirectoryReview } from "@/lib/seo/birmingham-directory";

function parseLocationReviewAuthor(author: string) {
  const match = author.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { area: match[2].trim(), name: match[1].trim() };
  }
  return { area: null as string | null, name: author.trim() };
}

/** Maps directory / location SEO reviews into the landing carousel card shape. */
export function directoryReviewsToLandingReviews(
  reviews: DirectoryReview[],
): LandingReview[] {
  return reviews.map((review, index) => {
    const { area, name } = parseLocationReviewAuthor(review.author);
    const detail = area ? `${review.service} · ${area}` : review.service;

    return {
      detail,
      id: `location-review-${index}-${review.body.slice(0, 16).replace(/\s+/g, "-")}`,
      name,
      quote: review.body,
    };
  });
}
