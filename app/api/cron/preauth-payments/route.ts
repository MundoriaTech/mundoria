import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { processDuePreauths } from "@/lib/payments/lifecycle";

/**
 * Places manual-capture holds on bookings that have a confirmed cleaner and
 * are inside the admin-configured pre-auth window (default T−24h).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDuePreauths();
    return NextResponse.json(result);
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
