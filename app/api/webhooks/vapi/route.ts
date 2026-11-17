import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { handleVapiEvent, vapiRequestAuthorized } from "@/lib/outreach/calls";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vapi server URL for the outreach assistant. Set the assistant's Server URL
 * to {NEXT_PUBLIC_APP_URL}/api/webhooks/vapi with a Bearer credential whose
 * token equals VAPI_WEBHOOK_SECRET. Receives status-update and
 * end-of-call-report messages.
 */
export async function POST(request: Request) {
  if (!vapiRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Parameters<typeof handleVapiEvent>[0];
    const result = await handleVapiEvent(body);
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error);
    // 200 so Vapi doesn't retry a message we can't process.
    return NextResponse.json({ ok: false });
  }
}
