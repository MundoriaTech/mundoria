import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { processDuePreauths } from "@/lib/payments/lifecycle";
import {
  processDuePaymentAuthAttempts,
  processPaymentAuthDeadlines,
} from "@/lib/payments/preauth-flow";

/**
 * Auth retries for awaiting_payment bookings, T−24h unpaid cancel,
 * plus legacy pre-auth for confirmed unpaid visits.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [attempts, deadlines, legacy] = await Promise.all([
      processDuePaymentAuthAttempts(),
      processPaymentAuthDeadlines(),
      processDuePreauths(),
    ]);
    return NextResponse.json({ attempts, deadlines, legacy });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Pre-auth cron failed",
      },
      { status: 500 },
    );
  }
}
