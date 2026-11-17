import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { handleInbound } from "@/lib/outreach/inbound";
import { findLead, logLeadEvent, optOutLead } from "@/lib/outreach/leads";
import { htmlToText, parseAddress, stripQuotedReply } from "@/lib/outreach/email-parse";
import { verifySvixSignature } from "@/lib/outreach/webhook-signature";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ResendEvent = {
  data?: {
    email_id?: string;
    from?: string;
    subject?: string;
    to?: string[] | string;
  };
  type?: string;
};

type ReceivedEmail = {
  from?: string;
  html?: string | null;
  id?: string;
  subject?: string;
  text?: string | null;
};

/**
 * Resend webhook: inbound replies (email.received) go to the AI; spam
 * complaints opt the lead out of email; bounces are logged on the lead.
 * Point a Resend webhook at {NEXT_PUBLIC_APP_URL}/api/webhooks/resend and put
 * its signing secret in RESEND_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySvixSignature(raw, request.headers, process.env.RESEND_WEBHOOK_SECRET ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(raw) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (event.type === "email.received" && event.data?.email_id) {
      const email = await fetchReceivedEmail(event.data.email_id);
      const { address, name } = parseAddress(email?.from ?? event.data.from ?? "");
      const body = stripQuotedReply(email?.text || htmlToText(email?.html ?? ""));
      if (address && body) {
        await handleInbound({
          body,
          channel: "email",
          from: address,
          fromName: name,
          providerId: event.data.email_id,
          subject: email?.subject ?? event.data.subject,
        });
      }
    } else if (event.type === "email.complained" || event.type === "email.bounced") {
      const recipients = Array.isArray(event.data?.to) ? event.data?.to : event.data?.to ? [event.data.to] : [];
      for (const recipient of recipients ?? []) {
        const lead = await findLead({ email: parseAddress(recipient).address });
        if (!lead) continue;
        if (event.type === "email.complained") {
          await optOutLead(lead, "email", "Marked our email as spam");
        } else {
          await logLeadEvent(lead.id, "email.bounced", "Email bounced; check the address");
        }
      }
    }
  } catch (error) {
    Sentry.captureException(error);
  }
  return NextResponse.json({ ok: true });
}

async function fetchReceivedEmail(id: string): Promise<ReceivedEmail | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as ReceivedEmail;
}
