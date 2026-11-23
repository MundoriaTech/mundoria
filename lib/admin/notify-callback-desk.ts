import * as Sentry from "@sentry/nextjs";

import { alertAdmins } from "@/lib/notifications/admin";

function leadName(row: { first_name: string; last_name: string }) {
  return `${row.first_name} ${row.last_name}`.trim() || "This person";
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
  isNew?: boolean;
  summary: string;
}) {
  const name = leadName(input.lead);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const link = `${appUrl.replace(/\/$/, "")}/admin/callback-leads/${input.lead.id}`;
  const title = input.isNew
    ? `${name} asked for a callback`
    : `Callback update for ${name}`;
  const who = input.actorName ? ` Updated by ${input.actorName}.` : "";
  const body = input.isNew
    ? `${name} asked us to call them.${who}`
    : `${name}: ${input.summary}.${who}`;

  try {
    await alertAdmins(
      input.isNew ? "callback_lead.new" : "callback_lead.updated",
      title,
      body,
      {
        actionUrl: link,
        email: input.lead.email,
        leadId: input.lead.id,
        name,
        phone: input.lead.phone,
      },
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}
