import * as Sentry from "@sentry/nextjs";
import twilio from "twilio";

import { appUrl } from "@/lib/outreach/config";
import { handleInbound } from "@/lib/outreach/inbound";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

/**
 * Twilio "A message comes in" webhook for the outreach number.
 * Set it in Twilio to exactly {NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms (HTTP POST):
 * the signature is checked against that URL.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const params = Object.fromEntries(new URLSearchParams(raw));
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = `${appUrl()}/api/webhooks/twilio/sms`;
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";

  if (!token || !twilio.validateRequest(token, signature, url, params)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await handleInbound({
      body: String(params.Body ?? ""),
      channel: "sms",
      from: String(params.From ?? ""),
      providerId: String(params.MessageSid ?? ""),
    });
  } catch (error) {
    Sentry.captureException(error);
  }
  // Replies are sent through the API, so the TwiML response stays empty.
  return new Response(EMPTY_TWIML, { headers: { "Content-Type": "text/xml" } });
}
