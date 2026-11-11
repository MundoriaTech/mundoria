import { NextResponse } from "next/server";

import { getGooglePlaceReviews } from "@/lib/google/place-reviews";

/**
 * Refresh hourly. Without this the route is frozen at build time, so a deploy
 * built before GOOGLE_PLACES_API_KEY was set would serve no reviews forever.
 */
export const revalidate = 3600;

export async function GET() {
  const reviews = await getGooglePlaceReviews();
  if (!reviews) {
    return NextResponse.json({ reviews: null });
  }
  return NextResponse.json({ reviews });
}
