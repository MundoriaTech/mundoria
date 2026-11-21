import * as Sentry from "@sentry/nextjs";

import { createAdminClient } from "@/lib/supabase/admin";
import { createZohoSalesEnquiry, isZohoCrmConfigured } from "@/lib/zoho/crm";
import { maySyncZohoEmail } from "@/lib/zoho/preview";

type QueueRow = { lead_id: string; callback_id: string; attempts: number };

export function salesIntakeConfig() {
  const ruleId = process.env.ZOHO_CRM_SALES_ASSIGNMENT_RULE_ID?.trim() ?? "";
  const keyField = process.env.ZOHO_CRM_ENQUIRY_KEY_FIELD?.trim() ?? "";
  if (!/^\d+$/.test(ruleId) || !/^[A-Za-z][A-Za-z0-9_]+$/.test(keyField) || !isZohoCrmConfigured()) {
    return null;
  }
  return { ruleId, keyField };
}

export async function queueZohoSalesEnquiry(leadId: string, callbackId: string, email: string) {
  if (!salesIntakeConfig() || !maySyncZohoEmail(email)) return;

  const { error } = await createAdminClient().from("zoho_sales_intake").upsert(
    { lead_id: leadId, callback_id: callbackId },
    { onConflict: "lead_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(`Could not queue the Zoho sales enquiry (${error.code})`);

  // The existing outreach heartbeat drains production requests. Preview can be
  // tested from the form without pointing the production scheduler at it.
  if (process.env.VERCEL_ENV === "preview") await syncZohoSalesEnquiries(leadId);
}

export async function syncZohoSalesEnquiries(onlyLeadId?: string) {
  const config = salesIntakeConfig();
  if (!config) return;

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
      const [lead, callback] = await Promise.all([
        admin.from("leads").select("do_not_contact,status").eq("id", row.lead_id).single(),
        admin.from("callback_leads")
          .select("email,first_name,last_name,phone,source,utm_source,utm_medium,utm_campaign,created_at")
          .eq("id", row.callback_id).single(),
      ]);
      if (lead.error || callback.error) throw new Error("Could not read the source of a Zoho sales enquiry");

      const enquiry = callback.data;
      if (lead.data.do_not_contact || lead.data.status === "unsubscribed" || !maySyncZohoEmail(enquiry.email)) {
        await finish({ completed_at: new Date().toISOString(), last_error: "SUPPRESSED" });
        continue;
      }

      const id = await createZohoSalesEnquiry({
        Company: "Household enquiry",
        Last_Name: enquiry.last_name.slice(0, 80),
        First_Name: enquiry.first_name.slice(0, 40),
        Email: enquiry.email,
        Email_Opt_Out: true,
        Phone: enquiry.phone,
        Lead_Source: "Online Store",
        Lead_Status: "New — Untouched",
        Description: [
          `Website callback requested: ${enquiry.created_at}`,
          `Source: ${enquiry.source}`,
          `Website callback: ${row.callback_id}`,
          `UTM: ${[enquiry.utm_source, enquiry.utm_medium, enquiry.utm_campaign].filter(Boolean).join(" / ") || "none"}`,
        ].join("\n"),
        [config.keyField]: row.lead_id,
      }, config.ruleId, config.keyField);
      await finish({ completed_at: new Date().toISOString(), zoho_lead_id: id, last_error: null });
    } catch (failure) {
      Sentry.captureException(failure);
      const message = failure instanceof Error ? failure.message : "Zoho sales intake failed";
      await finish({ last_error: message.slice(0, 200), next_attempt_at: minutesFromNow(Math.min(2 ** attempts, 60)) });
    }
  }
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
