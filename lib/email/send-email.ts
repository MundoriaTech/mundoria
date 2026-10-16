import { Resend } from "resend";

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

  const rendered = renderEmailTemplate(template, data);
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: from ?? defaultFrom(),
    html: rendered.html,
    replyTo: replyTo ?? defaultReplyTo(),
    subject: subject ?? rendered.subject,
    text: rendered.text,
    to,
  });

  return !error;
}

function defaultFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

function defaultReplyTo() {
  return process.env.SUPPORT_EMAIL?.trim() || "hello@mundoria.co.uk";
}
