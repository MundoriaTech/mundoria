import { Resend } from "resend";

import {
  type EmailTemplateId,
  renderEmailTemplate,
} from "@/lib/email/templates";

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

  const rendered = renderEmailTemplate(template, data);
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: from ?? defaultFrom(template),
    html: rendered.html,
    replyTo,
    subject: subject ?? rendered.subject,
    text: rendered.text,
    to,
  });

  return !error;
}

function defaultFrom(template: EmailTemplateId) {
  const fallback = template.startsWith("admin.")
    ? "CleanScape Alerts <alerts@resend.dev>"
    : template.startsWith("auth.")
      ? "CleanScape Security <security@resend.dev>"
      : "CleanScape <notifications@resend.dev>";

  return process.env.RESEND_FROM_EMAIL ?? fallback;
}
