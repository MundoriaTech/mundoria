import * as Sentry from "@sentry/nextjs";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createZohoSalesEnquiry,
  findZohoRecordsByEmail,
  flagZohoRepeatEnquiry,
  isZohoCrmConfigured,
  markZohoEmailOptOut,
  updateZohoCrmRecord,
  type ZohoCrmMatch,
} from "@/lib/zoho/crm";
import {
  CRM_ENQUIRY_STATUS,
  CRM_ENQUIRY_TYPE,
  CRM_LEAD_STATUS,
  CRM_USER_TYPE,
  crmLeadSource,
  LEGACY_AUTOMATION_STATUSES,
  ukDate,
} from "@/lib/zoho/mapping";
import { maySyncZohoEmail } from "@/lib/zoho/preview";

type QueueRow = { lead_id: string; callback_id: string; attempts: number };

/** The unique Leads field that holds Mundoria's lead id (exists in the org). */
const DEFAULT_KEY_FIELD = "Mundoria_Prospect_ID";

/**
 * Website callbacks become Sales leads whenever CRM credentials are set. The
 * key field defaults to Mundoria_Prospect_ID; without an assignment rule id
 * the lead is created for the API user (the CRM owner) instead of routed.
 */
export function salesIntakeConfig() {
  if (!isZohoCrmConfigured()) return null;
  const ruleId = process.env.ZOHO_CRM_SALES_ASSIGNMENT_RULE_ID?.trim() ?? "";
  const keyField = process.env.ZOHO_CRM_ENQUIRY_KEY_FIELD?.trim() || DEFAULT_KEY_FIELD;
  if (!/^[A-Za-z][A-Za-z0-9_]+$/.test(keyField)) return null;
  return { keyField, ruleId: /^\d+$/.test(ruleId) ? ruleId : null };
}

export async function queueZohoSalesEnquiry(leadId: string, callbackId: string, email: string) {
  if (!salesIntakeConfig() || !maySyncZohoEmail(email)) return;

  // One queue row per lead. A new callback re-arms it (latest request, retry
  // count reset) so a repeat request reaches the existing CRM lead too.
  const { error } = await createAdminClient().from("zoho_sales_intake").upsert(
    {
      attempts: 0,
      callback_id: callbackId,
      completed_at: null,
      last_error: null,
      lead_id: leadId,
      next_attempt_at: new Date().toISOString(),
    },
    { onConflict: "lead_id" },
  );
  if (error) {
    // Queue table missing or unavailable: still get the request to Sales now.
    Sentry.captureException(new Error(`Could not queue the Zoho sales enquiry (${error.code})`));
    await pushSalesEnquiry(leadId, callbackId);
    return;
  }

  // Speed to lead: try now. The run-outreach heartbeat retries failures.
  await syncZohoSalesEnquiries(leadId);
}

export async function syncZohoSalesEnquiries(onlyLeadId?: string) {
  if (!salesIntakeConfig()) return;

  const admin = createAdminClient();
  const now = new Date().toISOString();
  let query = admin.from("zoho_sales_intake")
    .select("lead_id,callback_id,attempts")
    .is("completed_at", null)
    .lte("next_attempt_at", now)
    .order("next_attempt_at", { ascending: true })
    .limit(onlyLeadId ? 1 : 10);
  if (onlyLeadId) query = query.eq("lead_id", onlyLeadId);
  const { data, error } = await query;
  if (error) throw new Error(`Could not read the Zoho sales queue (${error.code})`);

  for (const row of (data ?? []) as QueueRow[]) {
    const attempts = row.attempts + 1;
    // Claim atomically before contacting Zoho. A crashed worker leaves the
    // request eligible after the lease; the unique CRM key protects retries.
    const { data: claimed, error: claimError } = await admin.from("zoho_sales_intake")
      .update({ attempts, next_attempt_at: minutesFromNow(2) })
      .eq("lead_id", row.lead_id)
      .eq("attempts", row.attempts)
      .is("completed_at", null)
      .lte("next_attempt_at", now)
      .select("lead_id")
      .maybeSingle();
    if (claimError) throw new Error(`Could not claim a Zoho sales enquiry (${claimError.code})`);
    if (!claimed) continue;

    const finish = async (result: { completed_at?: string; zoho_lead_id?: string; last_error: string | null; next_attempt_at?: string }) => {
      const { error: updateError } = await admin.from("zoho_sales_intake")
        .update(result)
        .eq("lead_id", row.lead_id)
        .eq("attempts", attempts);
      if (updateError) throw new Error(`Could not save the Zoho enquiry result (${updateError.code})`);
    };

    try {
      const outcome = await pushSalesEnquiry(row.lead_id, row.callback_id, { rethrow: true });
      await finish({
        completed_at: new Date().toISOString(),
        last_error: outcome.suppressed ? "SUPPRESSED" : null,
        ...(outcome.zohoLeadId ? { zoho_lead_id: outcome.zohoLeadId } : {}),
      });
    } catch (failure) {
      Sentry.captureException(failure);
      const message = failure instanceof Error ? failure.message : "Zoho sales intake failed";
      await finish({ last_error: message.slice(0, 200), next_attempt_at: minutesFromNow(Math.min(2 ** attempts, 60)) });
    }
  }
}

/**
 * Create the Sales lead for one website callback, or take over the lead that
 * already exists for that email (the old email-keyed website sync or a
 * SalesIQ chat) so the person has one CRM lead. A lead Sales has worked keeps
 * its status and owner.
 */
async function pushSalesEnquiry(
  leadId: string,
  callbackId: string,
  options: { rethrow?: boolean } = {},
): Promise<{ suppressed?: boolean; zohoLeadId?: string }> {
  const config = salesIntakeConfig();
  if (!config) return { suppressed: true };
  try {
    const admin = createAdminClient();
    const [lead, callback, consent] = await Promise.all([
      admin.from("leads").select("do_not_contact,status").eq("id", leadId).single(),
      admin.from("callback_leads")
        .select("email,first_name,last_name,phone,source,utm_source,utm_medium,utm_campaign,created_at")
        .eq("id", callbackId).single(),
      admin.from("lead_consents")
        .select("granted,basis")
        .eq("lead_id", leadId)
        .eq("channel", "email")
        // Marketing permission: the latest opt-in or withdrawal. A callback's
        // own "request" consent does not count either way.
        .in("basis", ["opt_in", "withdrawn"])
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (lead.error || callback.error) throw new Error("Could not read the source of a Zoho sales enquiry");

    const enquiry = callback.data;
    if (lead.data.do_not_contact || lead.data.status === "unsubscribed" || !maySyncZohoEmail(enquiry.email)) {
      return { suppressed: true };
    }

    // A callback is not permission for marketing email; a recorded opt-in is.
    const marketingOptIn = Boolean(consent.data?.granted && consent.data.basis === "opt_in");
    const leadSource = crmLeadSource({ source: enquiry.source, utmMedium: enquiry.utm_medium });
    const description = [
      `Website callback requested: ${enquiry.created_at}`,
      `Source: ${enquiry.source}`,
      `Website callback: ${callbackId}`,
      `UTM: ${[enquiry.utm_source, enquiry.utm_medium, enquiry.utm_campaign].filter(Boolean).join(" / ") || "none"}`,
    ].join("\n");
    const enquiryFields = {
      Email_Opt_Out: !marketingOptIn,
      Enquiry_Date: ukDate(enquiry.created_at),
      Enquiry_Status: CRM_ENQUIRY_STATUS.new,
      Enquiry_Type: CRM_ENQUIRY_TYPE.cleaning,
      Preferred_Contact_Method: "Phone",
      User_Type: CRM_USER_TYPE.customer,
    };

    const existing = await adoptableLead(enquiry.email, leadId, config.keyField);
    if (existing) {
      const untouched = !existing.Lead_Status || LEGACY_AUTOMATION_STATUSES.has(existing.Lead_Status);
      // A popup request has no name ("Guest Lead"); a later form with a name fills it in.
      const realName = !isPlaceholderName(enquiry.first_name, enquiry.last_name);
      const placeholderInCrm = isPlaceholderName(existing.First_Name, existing.Last_Name);
      await updateZohoCrmRecord("Leads", existing.id, {
        ...enquiryFields,
        [config.keyField]: leadId,
        Phone: enquiry.phone,
        // Values the old sync wrote are replaced; a Chat source is kept.
        ...(existing.Lead_Source === "Chat" ? {} : { Lead_Source: leadSource }),
        ...(untouched ? { Company: "Household enquiry", Description: description, Lead_Status: CRM_LEAD_STATUS.newUntouched } : {}),
        ...(realName && placeholderInCrm
          ? { First_Name: enquiry.first_name.slice(0, 40), Last_Name: enquiry.last_name.slice(0, 80) }
          : {}),
      });
      // Assignment rules (and their call task) only run on create: tell Sales
      // about this new request with a note and a task due today.
      await flagZohoRepeatEnquiry({
        dueDate: ukDate(),
        leadId: existing.id,
        note: description,
        ownerId: ownerIdOf(existing),
        subject: `Call back: new website request (${enquiry.source})`,
      });
      return { zohoLeadId: existing.id };
    }

    const id = await createZohoSalesEnquiry({
      ...enquiryFields,
      Company: "Household enquiry",
      Description: description,
      Email: enquiry.email,
      First_Name: enquiry.first_name.slice(0, 40),
      Last_Name: enquiry.last_name.slice(0, 80),
      Lead_Source: leadSource,
      Lead_Status: CRM_LEAD_STATUS.newUntouched,
      Phone: enquiry.phone,
      [config.keyField]: leadId,
    }, config.ruleId, config.keyField);
    return { zohoLeadId: id };
  } catch (failure) {
    if (options.rethrow) throw failure;
    Sentry.captureException(failure);
    return {};
  }
}

/**
 * The CRM lead to reuse for this email: one already keyed to this Mundoria
 * lead, else one with no Mundoria key (made before this intake). Null when
 * none exists or the token cannot search (then create, and the unique key
 * still stops repeats).
 */
async function adoptableLead(email: string, leadId: string, keyField: string) {
  const matches = await findZohoRecordsByEmail("Leads", email, [keyField, "First_Name", "Last_Name", "Owner"]);
  if (!matches?.length) return null;
  const key = (match: ZohoCrmMatch) => match[keyField];
  return matches.find((match) => key(match) === leadId)
    ?? matches.find((match) => !key(match))
    ?? null;
}

async function zohoLeadIdFor(leadId: string) {
  const { data } = await createAdminClient()
    .from("zoho_sales_intake")
    .select("zoho_lead_id")
    .eq("lead_id", leadId)
    .maybeSingle();
  return (data?.zoho_lead_id as string | null | undefined) ?? null;
}

/**
 * The prospect booked: mark the Sales lead's enquiry as converted. Lead
 * Status is the salesperson's, so it is not changed. Soft-fails.
 */
export async function markZohoEnquiryBooked(leadId: string) {
  if (!salesIntakeConfig()) return;
  try {
    const zohoLeadId = await zohoLeadIdFor(leadId);
    if (zohoLeadId) await updateZohoCrmRecord("Leads", zohoLeadId, { Enquiry_Status: CRM_ENQUIRY_STATUS.converted });
  } catch (error) {
    Sentry.captureException(error);
  }
}

/** Email opt-out from the website: tick Email Opt Out on their CRM records. */
export async function markZohoProspectOptOut(leadId: string, email: string | null) {
  if (!isZohoCrmConfigured()) return;
  const zohoLeadId = await zohoLeadIdFor(leadId).catch(() => null);
  await markZohoEmailOptOut(email, zohoLeadId ? [zohoLeadId] : []);
}

/** The callback form's stand-in when no name was given (see /api/callback-leads). */
function isPlaceholderName(first: unknown, last: unknown) {
  const a = typeof first === "string" ? first.trim().toLowerCase() : "";
  const b = typeof last === "string" ? last.trim().toLowerCase() : "";
  return (!a || a === "guest") && (!b || b === "lead");
}

function ownerIdOf(match: ZohoCrmMatch) {
  const owner = match.Owner as { id?: unknown } | null | undefined;
  return typeof owner?.id === "string" ? owner.id : null;
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
