import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { processDueCaptures } from "@/lib/payments/lifecycle";

/**
 * Captures held payments whose next-day UK capture time has arrived.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueCaptures();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Capture cron failed",
      },
      { status: 500 },
    );
  }
}
