import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import {
  autoCompleteFinishedVisits,
  processDueCaptures,
} from "@/lib/payments/lifecycle";

/**
 * Captures held payments whose next-day UK capture time has arrived, and
 * completes visits the customer never confirmed after 48 hours.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueCaptures();
    const autoCompleted = await autoCompleteFinishedVisits();
    return NextResponse.json({ ...result, autoCompleted });
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
