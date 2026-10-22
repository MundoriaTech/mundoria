import { Resend } from "resend";

import { filterDeliverableEmails } from "@/lib/email/deliverable";
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
  if (!process.env.RESEND_API_KEY) return false;

  const recipients = filterDeliverableEmails(to);
  // Seed/demo/.local addresses are skipped on purpose — treat as success so
  // callers do not retry, and Resend reputation is not burned by bounces.
  if (!recipients.length) return true;

  const rendered = renderEmailTemplate(template, data);
  const { data: sent, error } = await new Resend(
    process.env.RESEND_API_KEY,
  ).emails.send({
    from: from ?? defaultFrom(),
    html: rendered.html,
    replyTo: replyTo ?? defaultReplyTo(),
    subject: subject ?? rendered.subject,
    text: rendered.text,
    to: recipients.length === 1 ? recipients[0] : recipients,
  });

  if (error) {
    console.error("[email] Resend send failed", {
      message: error.message,
      name: error.name,
      template,
    });
    return false;
  }

  return Boolean(sent?.id);
}

function defaultFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

function defaultReplyTo() {
  return process.env.SUPPORT_EMAIL?.trim() || "hello@mundoria.co.uk";
}
