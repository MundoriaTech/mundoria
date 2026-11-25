import { NextResponse } from "next/server";

import { enforceMatchCutoffs } from "@/lib/bookings/match-cutoff";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { settleOutstandingOffers } from "@/lib/matching/expire-offers";

/**
 * Expire unanswered job offers and cascade to the Emergency List, then warn
 * admins / cancel at no charge when nobody has accepted by the cutoff.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await settleOutstandingOffers();
  const cutoffs = await enforceMatchCutoffs();
  return NextResponse.json({ ...result, cutoffs });
}
