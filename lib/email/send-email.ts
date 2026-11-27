import { Resend } from "resend";

import { filterDeliverableEmails } from "@/lib/email/deliverable";
import { logEmail } from "@/lib/email/log";
import {
  type EmailTemplateId,
  renderEmailTemplate,
} from "@/lib/email/templates";

const DEFAULT_FROM = "Mundoria <hello@mundoria.co.uk>";

export interface SendBrandedEmailInput {
  data?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
  subject?: string;
  template: EmailTemplateId;
  to: string | string[];
}

export async function sendBrandedEmail({
  data = {},
  from,
  replyTo,
  subject,
  template,
  to,
}: SendBrandedEmailInput) {
  const rendered = renderEmailTemplate(template, data);
  const finalSubject = subject ?? rendered.subject;
  const log = (status: "sent" | "failed" | "skipped", extra: { error?: string; id?: string | null } = {}) =>
    logEmail({
      data,
      error: extra.error ?? null,
      providerMessageId: extra.id ?? null,
      status,
      subject: finalSubject,
      template,
      to,
    });

  if (!process.env.RESEND_API_KEY) {
    await log("failed", { error: "Email isn't set up (no RESEND_API_KEY)." });
    return false;
  }

  const recipients = filterDeliverableEmails(to);
  // Seed/demo/.local addresses are skipped on purpose, treat as success so
  // callers do not retry, and Resend reputation is not burned by bounces.
  if (!recipients.length) {
    await log("skipped", { error: "Test or undeliverable address." });
    return true;
  }

  let sent: { id?: string } | null = null;
  let error: { message: string; name?: string } | null = null;
  try {
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: from ?? defaultFrom(),
      html: rendered.html,
      replyTo: replyTo ?? defaultReplyTo(),
      subject: finalSubject,
      text: rendered.text,
      to: recipients.length === 1 ? recipients[0] : recipients,
    });
    sent = result.data;
    error = result.error;
  } catch (thrown) {
    await logEmail({
      data,
      error: thrown instanceof Error ? thrown.message : "Send failed",
      status: "failed",
      subject: finalSubject,
      template,
      to: recipients,
    });
    throw thrown;
  }

  if (error) {
    console.error("[email] Resend send failed", {
      message: error.message,
      name: error.name,
      template,
    });
    await logEmail({ data, error: error.message, status: "failed", subject: finalSubject, template, to: recipients });
    return false;
  }

  await logEmail({
    data,
    providerMessageId: sent?.id ?? null,
    status: sent?.id ? "sent" : "failed",
    subject: finalSubject,
    template,
    to: recipients,
    ...(sent?.id ? {} : { error: "No message id returned." }),
  });
  return Boolean(sent?.id);
}

function defaultFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

function defaultReplyTo() {
  const raw = process.env.SUPPORT_EMAIL?.trim() || "hello@mundoria.co.uk";
  if (/cleanscape/i.test(raw)) return "hello@mundoria.co.uk";
  return raw;
}

/** Ops inbox for signup / application alerts. Prefer ADMIN_NOTIFICATION_EMAIL. */
export function resolveAdminNotificationEmail() {
  const dedicated = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (dedicated) return dedicated;
  const support = process.env.SUPPORT_EMAIL?.trim();
  if (support && !/cleanscape/i.test(support)) return support;
  return "hello@mundoria.co.uk";
}
