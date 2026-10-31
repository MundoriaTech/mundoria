import { NextResponse } from "next/server";

import { processAbandonedBookingReminders } from "@/lib/bookings/drafts";
import { isAuthorizedCron } from "@/lib/cron/auth";

/** Reminds guests who left an email but never finished booking. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAbandonedBookingReminders();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Abandoned booking reminder cron failed",
      },
      { status: 500 },
    );
  }
}
