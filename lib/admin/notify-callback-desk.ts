import * as Sentry from "@sentry/nextjs";

import { callbackDisplayName } from "@/lib/admin/callback-desk";
import { isMetaOfferSource } from "@/lib/bookings/percent-offer";
import { alertAdmins } from "@/lib/notifications/admin";

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
  /** Callback source; 20%-off (Meta) leads only alert admins who can see them. */
  source?: string | null;
  summary: string;
}) {
  const meta = isMetaOfferSource(input.source);
  const display = callbackDisplayName(input.lead);
  // Popup requests carry no name: lead with the phone number instead.
  const name = display === "No name given" ? `Someone (${input.lead.phone})` : display;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const link = `${appUrl.replace(/\/$/, "")}/admin/${meta ? "meta-leads" : "callback-leads"}/${input.lead.id}`;
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
      { area: meta ? "meta_leads" : "callback_leads" },
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}
