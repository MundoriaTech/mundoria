import { NextResponse } from "next/server";

import { purgeOldEmailLog, sendConfirmReminders } from "@/lib/bookings/confirm-reminder";
import { isAuthorizedCron } from "@/lib/cron/auth";
import {
  autoCompleteFinishedVisits,
  processDueCaptures,
} from "@/lib/payments/lifecycle";

/**
 * Reminds customers to confirm finished visits before their card is charged,
 * captures held payments whose next-day UK capture time has arrived,
 * completes visits the customer never confirmed after 48 hours, and drops
 * email_log rows older than 12 months.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Remind first, so nobody is reminded about a charge that just happened.
    const reminders = await sendConfirmReminders().catch(() => ({ reminded: 0 }));
    const result = await processDueCaptures();
    const autoCompleted = await autoCompleteFinishedVisits();
    await purgeOldEmailLog().catch(() => undefined);
    return NextResponse.json({ ...result, autoCompleted, ...reminders });
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
