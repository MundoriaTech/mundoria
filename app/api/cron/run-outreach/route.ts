import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { outreachEnabled } from "@/lib/outreach/config";
import { markBookedLeads, runDueEnrollments, syncDraftLeads } from "@/lib/outreach/engine";
import { syncZohoSalesEnquiries } from "@/lib/zoho/sales-intake";
import { syncCleanerCalendar } from "@/lib/zoho/calendar-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Lead automation heartbeat (cron-job.org, every 5 minutes):
 * 1. mark leads that booked (stops their follow-ups),
 * 2. pull in unfinished booking drafts,
 * 3. run every due journey step (emails, texts, AI calls, staff alerts).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await syncZohoSalesEnquiries().catch((error) => Sentry.captureException(error));
  // Independent of marketing/outreach being enabled. Transactional scheduling
  // uses the existing heartbeat, so no new paid cron service is required.
  await syncCleanerCalendar().catch(() => Sentry.captureException(new Error("CALENDAR_HEARTBEAT_FAILED")));
  try {
    const booked = await markBookedLeads();
    if (!outreachEnabled()) {
      return NextResponse.json({ booked, enabled: false });
    }
    const drafts = await syncDraftLeads();
    const steps = await runDueEnrollments({ limit: 40 });
    return NextResponse.json({ booked, drafts, enabled: true, steps });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "run-outreach failed" },
      { status: 500 },
    );
  }
}
