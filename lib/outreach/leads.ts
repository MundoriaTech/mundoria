import * as Sentry from "@sentry/nextjs";

import { normalizeEmail, toE164 } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { CRM_ENQUIRY_STATUS, CRM_LEAD_STATUS } from "@/lib/zoho/mapping";
import { markZohoProspectOptOut } from "@/lib/zoho/sales-intake";
import { setSalesLeadStatusInZoho } from "@/lib/zoho/sync-jobs";

export type LeadStatus = "new" | "contacted" | "engaged" | "booked" | "lost" | "unsubscribed";
export type Channel = "email" | "sms" | "call";
export type ConsentBasis = "opt_in" | "request" | "soft_opt_in" | "withdrawn" | "admin";

export type LeadRow = {
  attributed_message_id: string | null;
  automation_paused: boolean;
  booked_at: string | null;
  booking_id: string | null;
  callback_requested_at: string | null;
  created_at: string;
  do_not_contact: boolean;
  email: string | null;
  first_name: string | null;
  id: string;
  last_inbound_at: string | null;
  last_name: string | null;
  last_outbound_at: string | null;
  needs_human: boolean;
  needs_human_reason: string | null;
  notes: string | null;
  owner_id: string | null;
  phone: string | null;
  profile_id: string | null;
  source: string;
  status: LeadStatus;
  unsubscribe_token: string;
  updated_at: string;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_source: string | null;
};

export const LEAD_COLUMNS =
  "id,email,phone,first_name,last_name,status,source,utm_source,utm_medium,utm_campaign,profile_id,owner_id,automation_paused,do_not_contact,needs_human,needs_human_reason,unsubscribe_token,callback_requested_at,last_outbound_at,last_inbound_at,booked_at,booking_id,attributed_message_id,notes,created_at,updated_at";

/** Wording shown next to each capture form, stored with the consent record. */
export const CONSENT_WORDING = {
  bookingDraftSoftOptIn:
    "Started a booking and gave an email address. Follow-ups about that booking, with an unsubscribe link in every email (PECR soft opt-in).",
  callbackRequest:
    "By continuing you agree we may contact you about this offer. (Callback request form: phone call, text and email about the request.)",
  marketingOptIn: "Ticked: I agree to receive Mundoria’s offers and news by email and SMS.",
  newsletterSignup:
    "Mundoria Mag newsletter form: \"Receive our newsletters directly, and take advantage of our little tips & advice!\" (pressed Subscribe).",
} as const;

type UpsertLeadInput = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  profileId?: string | null;
  source: string;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
};

/**
 * Find a lead by email (then phone) or create one. Existing leads keep their
 * original source; missing names, phone and UTMs are filled in.
 */
export async function upsertLead(input: UpsertLeadInput): Promise<{ created: boolean; lead: LeadRow } | null> {
  const email = normalizeEmail(input.email);
  const phone = toE164(input.phone ?? "") || null;
  if (!email && !phone) return null;

  const admin = createAdminClient();
  const existing = await findLead({ email, phone });

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.email && email) patch.email = email;
    if (!existing.phone && phone) patch.phone = phone;
    if (!existing.first_name && input.firstName?.trim()) patch.first_name = input.firstName.trim();
    if (!existing.last_name && input.lastName?.trim()) patch.last_name = input.lastName.trim();
    if (!existing.profile_id && input.profileId) patch.profile_id = input.profileId;
    if (!existing.utm_source && input.utmSource) patch.utm_source = input.utmSource;
    if (!existing.utm_medium && input.utmMedium) patch.utm_medium = input.utmMedium;
    if (!existing.utm_campaign && input.utmCampaign) patch.utm_campaign = input.utmCampaign;
    // A lead that went quiet but came back through a new form is live again.
    if (existing.status === "lost") patch.status = "new";
    if (!Object.keys(patch).length) return { created: false, lead: existing };
    const { data } = await admin
      .from("leads")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select(LEAD_COLUMNS)
      .single();
    return { created: false, lead: (data as LeadRow | null) ?? existing };
  }

  const { data, error } = await admin
    .from("leads")
    .insert({
      email: email || null,
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      phone,
      profile_id: input.profileId ?? null,
      source: input.source,
      utm_campaign: input.utmCampaign ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_source: input.utmSource ?? null,
    })
    .select(LEAD_COLUMNS)
    .single();

  if (error || !data) {
    // Unique email race: another request created it first.
    const again = await findLead({ email, phone });
    return again ? { created: false, lead: again } : null;
  }

  const lead = data as LeadRow;
  await logLeadEvent(lead.id, "lead.created", `New lead from ${input.source}`, {
    utm_campaign: input.utmCampaign,
    utm_source: input.utmSource,
  });
  return { created: true, lead };
}

export async function findLead({ email, phone }: { email?: string | null; phone?: string | null }) {
  const admin = createAdminClient();
  const cleanEmail = normalizeEmail(email);
  if (cleanEmail) {
    const { data } = await admin
      .from("leads")
      .select(LEAD_COLUMNS)
      .ilike("email", cleanEmail)
      .maybeSingle();
    if (data) return data as LeadRow;
  }
  const cleanPhone = toE164(phone ?? "");
  if (cleanPhone) {
    const { data } = await admin
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as LeadRow;
  }
  return null;
}

export async function getLead(id: string) {
  const { data } = await createAdminClient()
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as LeadRow | null) ?? null;
}

export async function updateLead(
  lead: LeadRow,
  patch: Partial<Omit<LeadRow, "id" | "created_at">>,
  event?: { summary: string; type: string; payload?: Record<string, unknown>; actorId?: string | null },
) {
  const { data } = await createAdminClient()
    .from("leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", lead.id)
    .select(LEAD_COLUMNS)
    .single();
  const next = (data as LeadRow | null) ?? { ...lead, ...patch };
  if (event) {
    await logLeadEvent(lead.id, event.type, event.summary, event.payload ?? {}, event.actorId ?? null);
  }
  if (patch.status === "booked" && lead.status !== "booked") {
    // Booked: the Sales lead shows it (Lead Status Booked, enquiry Converted).
    await setSalesLeadStatusInZoho(lead.id, CRM_LEAD_STATUS.booked, CRM_ENQUIRY_STATUS.converted);
  }
  return next;
}

/** Move status forward only (new → contacted → engaged); booked/lost/unsubscribed are set explicitly. */
export async function advanceStatus(lead: LeadRow, to: "contacted" | "engaged") {
  const order: LeadStatus[] = ["new", "contacted", "engaged"];
  if (!order.includes(lead.status)) return lead;
  if (order.indexOf(to) <= order.indexOf(lead.status)) return lead;
  return updateLead(lead, { status: to }, { summary: `Status: ${to}`, type: "lead.status" });
}

export async function recordConsent(
  leadId: string,
  channel: Channel,
  granted: boolean,
  basis: ConsentBasis,
  wording: string,
  sourcePage?: string | null,
) {
  await createAdminClient().from("lead_consents").insert({
    basis,
    channel,
    granted,
    lead_id: leadId,
    source_page: sourcePage ?? null,
    wording,
  });
}

/** Current consent per channel (latest record wins). */
export async function currentConsents(leadId: string) {
  const { data } = await createAdminClient()
    .from("lead_consents")
    .select("channel,granted,basis,captured_at")
    .eq("lead_id", leadId)
    .order("captured_at", { ascending: false });
  const result: Record<Channel, { basis: ConsentBasis; granted: boolean } | null> = {
    call: null,
    email: null,
    sms: null,
  };
  for (const row of data ?? []) {
    const channel = row.channel as Channel;
    if (!result[channel]) result[channel] = { basis: row.basis as ConsentBasis, granted: Boolean(row.granted) };
  }
  return result;
}

export async function logLeadEvent(
  leadId: string,
  type: string,
  summary: string,
  payload: Record<string, unknown> = {},
  actorId: string | null = null,
) {
  const { error } = await createAdminClient().from("lead_events").insert({
    actor_id: actorId,
    lead_id: leadId,
    payload,
    summary: summary.slice(0, 500),
    type,
  });
  if (error) Sentry.captureException(error);
}

/** Stop every automated touch for this lead (unsubscribe, STOP, or "don't contact me"). */
export async function optOutLead(lead: LeadRow, channel: Channel | "all", reason: string) {
  const channels: Channel[] = channel === "all" ? ["email", "sms", "call"] : [channel];
  for (const item of channels) {
    await recordConsent(lead.id, item, false, "withdrawn", reason);
  }
  const allOut = channel === "all";
  const next = await updateLead(
    lead,
    allOut ? { do_not_contact: true, status: "unsubscribed" } : {},
    { summary: `Opted out (${channel}): ${reason}`, type: "lead.opt_out" },
  );
  if (allOut || channel === "email") await markZohoProspectOptOut(lead.id, lead.email);
  if (allOut) {
    await createAdminClient()
      .from("outreach_enrollments")
      .update({ status: "stopped", stop_reason: "opted_out", updated_at: new Date().toISOString() })
      .eq("lead_id", lead.id)
      .eq("status", "active");
  }
  return next;
}

export function leadName(lead: Pick<LeadRow, "first_name" | "last_name">) {
  return [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
}
