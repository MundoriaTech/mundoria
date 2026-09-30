import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { settleOutstandingOffers } from "@/lib/matching/expire-offers";

/** Expire unanswered job offers and cascade to the Emergency List. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await settleOutstandingOffers();
  return NextResponse.json(result);
}
