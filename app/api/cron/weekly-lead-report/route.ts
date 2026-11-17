import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { generateWeeklyReport } from "@/lib/outreach/report";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Weekly lead automation report (cron-job.org, Mondays 08:00 UK). Safe to re-run. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await generateWeeklyReport();
    return NextResponse.json({ ok: true, ...("skipped" in result ? { skipped: result.skipped } : { id: result.id }) });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "weekly report failed" },
      { status: 500 },
    );
  }
}
