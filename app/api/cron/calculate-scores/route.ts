import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { calculateCleanerScores } from "@/lib/scoring/engine";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ results: await calculateCleanerScores() });
}
