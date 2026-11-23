import * as Sentry from "@sentry/nextjs";

import { alertAdmins } from "@/lib/notifications/admin";
import {
  resolveAdminNotificationEmail,
  sendBrandedEmail,
} from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

function leadName(row: { first_name: string; last_name: string }) {
  return `${row.first_name} ${row.last_name}`.trim() || "Callback lead";
}

export async function notifyCallbackDeskChange(input: {
  actorEmail?: string | null;
  actorName?: string | null;
  lead: {
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    phone: string;
  };
  summary: string;
}) {
  const name = leadName(input.lead);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const link = `${appUrl.replace(/\/$/, "")}/admin/callback-leads`;
  const title = `Callback lead: ${name}`;
  const body = `${input.summary}${input.actorName ? ` (${input.actorName})` : ""}. ${input.lead.phone}. ${input.lead.email}.`;

  try {
    await alertAdmins("callback_lead.updated", title, body, {
      actionUrl: link,
      email: input.lead.email,
      leadId: input.lead.id,
      phone: input.lead.phone,
    });
  } catch (error) {
    Sentry.captureException(error);
  }

  if (!process.env.RESEND_API_KEY) return;

  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "admin");
  const already = new Set(
    (admins ?? [])
      .map((row) => row.email?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );
  const ops = resolveAdminNotificationEmail().toLowerCase();
  if (already.has(ops)) return;

  try {
    await sendBrandedEmail({
      data: { actionUrl: link, body, preview: title, title },
      subject: `[Admin] ${title}`,
      template: "admin.alert",
      to: ops,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}
