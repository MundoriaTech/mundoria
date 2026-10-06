import { NextResponse } from "next/server";

import { getGooglePlaceReviews } from "@/lib/google/place-reviews";

export async function GET() {
  const reviews = await getGooglePlaceReviews();
  if (!reviews) {
    return NextResponse.json({ reviews: null });
  }
  return NextResponse.json({ reviews });
}
