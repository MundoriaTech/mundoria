import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import twilio from "twilio";

import { filterDeliverableEmails } from "@/lib/email/deliverable";
import { renderEmailTemplate } from "@/lib/email/templates";
import {
  appUrl,
  emailConfigured,
  outreachFrom,
  outreachReplyTo,
  smsConfigured,
  smsFrom,
  toE164,
} from "@/lib/outreach/config";
import { currentConsents, type Channel, type LeadRow } from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendResult = { messageId?: string; ok: boolean; reason?: string };

type Meta = {
  aiGenerated?: boolean;
  aiIntent?: string | null;
  enrollmentId?: string | null;
  /** Skip the consent check for a direct reply to something the lead sent us. */
  isReply?: boolean;
};

export function unsubscribeUrl(lead: Pick<LeadRow, "unsubscribe_token">) {
  return `${appUrl()}/unsubscribe?token=${encodeURIComponent(lead.unsubscribe_token)}`;
}

/** Can we contact this lead on this channel right now? Returns a reason when not. */
export async function channelBlocked(lead: LeadRow, channel: Channel, isReply = false) {
  if (lead.do_not_contact) return "do_not_contact";
  if (channel === "email" && !lead.email) return "no_email";
  if (channel !== "email" && !toE164(lead.phone ?? "")) return "no_phone";
  if (isReply) return null; // answering someone who wrote to us is always allowed
  const consents = await currentConsents(lead.id);
  const consent = consents[channel];
  if (!consent?.granted) return `no_${channel}_consent`;
  return null;
}

export async function sendLeadEmail(
  lead: LeadRow,
  message: { actionLabel?: string; actionUrl?: string; body: string; subject: string },
  meta: Meta = {},
): Promise<SendResult> {
  const blocked = await channelBlocked(lead, "email", meta.isReply);
  if (blocked) return logOutbound(lead, "email", message, meta, { ok: false, reason: blocked }, "skipped");
  if (!emailConfigured()) {
    return logOutbound(lead, "email", message, meta, { ok: false, reason: "email_not_configured" }, "skipped");
  }
  const [to] = filterDeliverableEmails(lead.email!);
  if (!to) {
    return logOutbound(lead, "email", message, meta, { ok: false, reason: "undeliverable_address" }, "skipped");
  }

  const unsubscribe = unsubscribeUrl(lead);
  const rendered = renderEmailTemplate("outreach.message", {
    actionLabel: message.actionLabel,
    actionUrl: message.actionUrl,
    appUrl: appUrl(),
    body: message.body,
    firstName: lead.first_name ?? "",
    subject: message.subject,
    unsubscribeUrl: unsubscribe,
  });

  try {
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: outreachFrom(),
      // One-click unsubscribe (RFC 8058), required by Gmail and Yahoo for bulk senders.
      headers: {
        "List-Unsubscribe": `<${appUrl()}/api/outreach/unsubscribe?token=${encodeURIComponent(lead.unsubscribe_token)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      html: rendered.html,
      replyTo: outreachReplyTo(),
      subject: rendered.subject,
      text: rendered.text,
      to,
    });
    if (error || !data?.id) {
      return logOutbound(lead, "email", message, meta, { ok: false, reason: error?.message ?? "send_failed" }, "failed");
    }
    return logOutbound(lead, "email", message, meta, { messageId: data.id, ok: true }, "sent");
  } catch (error) {
    Sentry.captureException(error);
    return logOutbound(lead, "email", message, meta, { ok: false, reason: String(error) }, "failed");
  }
}

export async function sendLeadSms(lead: LeadRow, body: string, meta: Meta = {}): Promise<SendResult> {
  const message = { body, subject: "" };
  const blocked = await channelBlocked(lead, "sms", meta.isReply);
  if (blocked) return logOutbound(lead, "sms", message, meta, { ok: false, reason: blocked }, "skipped");
  if (!smsConfigured()) {
    return logOutbound(lead, "sms", message, meta, { ok: false, reason: "sms_not_configured" }, "skipped");
  }

  // Every automated text carries the opt-out line (replies to the lead don't need it twice).
  const text = meta.isReply || /reply stop/i.test(body) ? body : `${body} Reply STOP to opt out.`;
  try {
    const sent = await twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN).messages.create({
      body: text,
      from: smsFrom(),
      to: toE164(lead.phone!),
    });
    return logOutbound(lead, "sms", { body: text, subject: "" }, meta, { messageId: sent.sid, ok: true }, "sent");
  } catch (error) {
    Sentry.captureException(error);
    return logOutbound(lead, "sms", message, meta, { ok: false, reason: String(error) }, "failed");
  }
}

/** Text a member of staff (not a lead): on-call alerts. */
export async function sendStaffSms(to: string, body: string) {
  if (!smsConfigured() || !toE164(to)) return false;
  try {
    await twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN).messages.create({
      body,
      from: smsFrom(),
      to: toE164(to),
    });
    return true;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

async function logOutbound(
  lead: LeadRow,
  channel: "email" | "sms",
  message: { body: string; subject: string },
  meta: Meta,
  result: SendResult,
  status: "sent" | "failed" | "skipped",
): Promise<SendResult> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("outreach_messages")
    .insert({
      ai_generated: Boolean(meta.aiGenerated),
      ai_intent: meta.aiIntent ?? null,
      body: message.body,
      channel,
      direction: "outbound",
      enrollment_id: meta.enrollmentId ?? null,
      error: result.ok ? null : result.reason ?? null,
      lead_id: lead.id,
      provider_id: result.messageId ?? null,
      status,
      subject: message.subject || null,
    })
    .select("id")
    .single();
  if (status === "sent") {
    await admin
      .from("leads")
      .update({ last_outbound_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", lead.id);
  }
  return { ...result, messageId: (data?.id as string | undefined) ?? result.messageId };
}
