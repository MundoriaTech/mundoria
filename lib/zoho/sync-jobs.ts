import * as Sentry from "@sentry/nextjs";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadCleanerSnapshot } from "@/lib/zoho/cleaner-snapshot";
import {
  addZohoCrmNote,
  createZohoSalesEnquiry,
  isZohoCrmConfigured,
  updateZohoCrmRecordStrict,
  upsertZohoCrmRecordStrict,
  zohoNameFields,
} from "@/lib/zoho/crm";
import { ZohoPermanentError } from "@/lib/zoho/http";
import {
  CRM_ENQUIRY_STATUS,
  CRM_ENQUIRY_TYPE,
  CRM_LEAD_STATUS,
  CRM_USER_TYPE,
  RECRUIT_ACTIVATION,
  RECRUIT_LIFECYCLE,
  ukDate,
} from "@/lib/zoho/mapping";
import { maySyncZohoEmail } from "@/lib/zoho/preview";
import { salesIntakeConfig } from "@/lib/zoho/sales-intake";
import { isZohoRecruitConfigured, upsertZohoCandidateStrict } from "@/lib/zoho/recruit";

/**
 * Mundoria → Zoho write-back for everything the website forms don't cover:
 * admin decisions on cleaners, the call desk and leads page, bookings,
 * disputes, refunds and AI calls. Each change is tried at once; a failure
 * stays in zoho_sync_jobs and the run-outreach cron retries it with backoff.
 * Refusals that retrying cannot fix (missing scope, rejected value) stop
 * straight away with the reason kept on the row.
 */

type Person = { email: string; fullName: string; phone?: string | null; userId?: string | null };

export type ZohoSyncJob =
  /** Re-send the cleaner's whole Recruit picture (latest state wins). */
  | { kind: "cleaner_snapshot"; payload: { cleanerId: string } }
  /** A cleaner account deleted in Mundoria: close the candidate. */
  | { kind: "candidate_closed"; payload: { person: Person; reason: string } }
  /** Pipeline status on the person's Sales lead (website callback lead). */
  | { kind: "sales_lead_status"; payload: { enquiryStatus?: string | null; leadId: string; leadStatus?: string | null } }
  /** A note on the Sales lead, or on the customer's Contact. */
  | {
      kind: "crm_note";
      payload: {
        content: string;
        target: { leadId: string; type: "sales_lead" } | { person: Person; type: "contact" };
        title: string;
      };
    }
  /** Fields on the customer's Contact (e.g. Account_Status). */
  | { kind: "contact_fields"; payload: { fields: Record<string, unknown>; person: Person } }
  /** A lead added by hand in admin becomes a Sales lead (callbacks have their own intake). */
  | { kind: "sales_lead_create"; payload: { addedBy: string; leadId: string; notes?: string | null; source: string } };

type JobRow = { attempts: number; id: string | null; kind: ZohoSyncJob["kind"]; payload: ZohoSyncJob["payload"] };

const TABLE = "zoho_sync_jobs";
const MAX_ATTEMPTS = 8;
/** While a job runs inline it is leased this long, so the cron leaves it alone. */
const LEASE_MS = 5 * 60_000;

class Skip extends Error {}

function dedupeKeyFor(job: ZohoSyncJob) {
  if (job.kind === "cleaner_snapshot") return `cleaner:${job.payload.cleanerId}`;
  if (job.kind === "sales_lead_status") return `sales-lead:${job.payload.leadId}`;
  if (job.kind === "sales_lead_create") return `sales-lead-create:${job.payload.leadId}`;
  return null;
}

function configuredFor(kind: ZohoSyncJob["kind"]) {
  return kind === "cleaner_snapshot" || kind === "candidate_closed" ? isZohoRecruitConfigured() : isZohoCrmConfigured();
}

/**
 * Record a change for Zoho and try it now. Never throws, and never blocks the
 * admin's action for more than one Zoho round trip.
 */
export async function queueZohoSync(job: ZohoSyncJob) {
  if (!configuredFor(job.kind)) return;
  const row = await persist(job).catch(() => null);
  await runJob(row ?? { attempts: 0, id: null, kind: job.kind, payload: job.payload });
}

/** Several changes from one action, run one after another. */
export async function queueZohoSyncs(jobs: ZohoSyncJob[]) {
  for (const job of jobs) await queueZohoSync(job);
}

async function persist(job: ZohoSyncJob): Promise<JobRow | null> {
  const admin = createAdminClient();
  const dedupeKey = dedupeKeyFor(job);
  const leaseUntil = new Date(Date.now() + LEASE_MS).toISOString();
  const { data, error } = await admin
    .from(TABLE)
    .insert({ dedupe_key: dedupeKey, kind: job.kind, next_attempt_at: leaseUntil, payload: job.payload })
    .select("id,attempts")
    .single();
  if (data) return { attempts: 0, id: data.id as string, kind: job.kind, payload: job.payload };
  if (error?.code === "23505" && dedupeKey) {
    // An open job for the same record: it now carries the latest change.
    const { data: open } = await admin
      .from(TABLE)
      .update({ next_attempt_at: leaseUntil, payload: job.payload })
      .eq("dedupe_key", dedupeKey)
      .is("completed_at", null)
      .is("failed_at", null)
      .select("id,attempts")
      .maybeSingle();
    if (open) return { attempts: Number(open.attempts ?? 0), id: open.id as string, kind: job.kind, payload: job.payload };
  }
  if (error) Sentry.captureMessage(`Zoho sync job not saved (${error.code ?? "unknown"}); running once without retries`, "warning");
  return null;
}

async function runJob(row: JobRow) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  try {
    await perform({ kind: row.kind, payload: row.payload } as ZohoSyncJob);
    if (row.id) await admin.from(TABLE).update({ completed_at: now, last_error: null }).eq("id", row.id);
    return "done" as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Skip) {
      if (row.id) await admin.from(TABLE).update({ completed_at: now, last_error: `skipped: ${message}` }).eq("id", row.id);
      return "skipped" as const;
    }
    const attempts = row.attempts + 1;
    const permanent = error instanceof ZohoPermanentError || attempts >= MAX_ATTEMPTS;
    if (permanent) Sentry.captureMessage(`Zoho sync gave up (${row.kind}): ${message}`, "warning");
    else if (!row.id) Sentry.captureException(error);
    if (row.id) {
      const backoffMinutes = Math.min(360, 5 * 2 ** (attempts - 1));
      await admin
        .from(TABLE)
        .update({
          attempts,
          last_error: message.slice(0, 500),
          ...(permanent
            ? { failed_at: now }
            : { next_attempt_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString() }),
        })
        .eq("id", row.id);
    }
    return permanent ? ("failed" as const) : ("retry" as const);
  }
}

/** Cron: retry due jobs. */
export async function drainZohoSyncJobs(limit = 30) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(TABLE)
    .select("id,kind,payload,attempts")
    .is("completed_at", null)
    .is("failed_at", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  if (error) return { error: error.code ?? "unknown" };
  const counts = { done: 0, failed: 0, retry: 0, skipped: 0 };
  for (const row of data ?? []) {
    // Lease it first so an overlapping run does not send it twice.
    await admin.from(TABLE).update({ next_attempt_at: new Date(Date.now() + LEASE_MS).toISOString() }).eq("id", row.id);
    const result = await runJob({
      attempts: Number(row.attempts ?? 0),
      id: row.id as string,
      kind: row.kind as ZohoSyncJob["kind"],
      payload: row.payload as ZohoSyncJob["payload"],
    });
    counts[result] += 1;
  }
  return counts;
}

async function perform(job: ZohoSyncJob) {
  switch (job.kind) {
    case "cleaner_snapshot": {
      const snapshot = await loadCleanerSnapshot(job.payload.cleanerId);
      if (!snapshot) throw new Skip("cleaner not found");
      if (!maySyncZohoEmail(snapshot.person.email)) throw new Skip("email not synced");
      await upsertZohoCandidateStrict(snapshot.person, snapshot.fields);
      return;
    }
    case "candidate_closed": {
      const { person, reason } = job.payload;
      if (!maySyncZohoEmail(person.email)) throw new Skip("email not synced");
      await upsertZohoCandidateStrict(
        { email: person.email, fullName: person.fullName, phone: person.phone, userId: person.userId ?? "" },
        {
          Activation_Review: RECRUIT_ACTIVATION.onHold,
          Cleaner_Lifecycle_Stage: RECRUIT_LIFECYCLE.rejected,
          Next_Operations_Action: `Account deleted in Mundoria: ${reason}`.slice(0, 255),
        },
      );
      return;
    }
    case "sales_lead_status": {
      const zohoLeadId = await zohoSalesLeadId(job.payload.leadId);
      const fields: Record<string, unknown> = {};
      if (job.payload.leadStatus) fields.Lead_Status = job.payload.leadStatus;
      if (job.payload.enquiryStatus) fields.Enquiry_Status = job.payload.enquiryStatus;
      if (!Object.keys(fields).length) throw new Skip("nothing to change");
      await updateZohoCrmRecordStrict("Leads", zohoLeadId, fields);
      return;
    }
    case "crm_note": {
      const { content, target, title } = job.payload;
      if (target.type === "sales_lead") {
        await addZohoCrmNote("Leads", await zohoSalesLeadId(target.leadId), title, content);
        return;
      }
      await addZohoCrmNote("Contacts", await contactId(target.person), title, content);
      return;
    }
    case "contact_fields": {
      const id = await contactId(job.payload.person);
      await updateZohoCrmRecordStrict("Contacts", id, job.payload.fields);
      return;
    }
    case "sales_lead_create": {
      await createSalesLeadForHandAddedLead(job.payload);
      return;
    }
  }
}

/** How a hand-added lead reached us, in the org's Lead_Source picklist where one fits. */
const HAND_ADDED_SOURCE: Record<string, string | undefined> = {
  event: "Trade Show",
  referral: "External Referral",
};

async function createSalesLeadForHandAddedLead(input: { addedBy: string; leadId: string; notes?: string | null; source: string }) {
  const config = salesIntakeConfig();
  if (!config) throw new Skip("sales intake not configured");
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("zoho_sales_intake")
    .select("zoho_lead_id")
    .eq("lead_id", input.leadId)
    .maybeSingle();
  if (existing?.zoho_lead_id) throw new Skip("already has a Zoho sales lead");
  const { data: lead } = await admin
    .from("leads")
    .select("email,first_name,last_name,phone,do_not_contact,status")
    .eq("id", input.leadId)
    .maybeSingle();
  if (!lead) throw new Skip("lead not found");
  const email = String(lead.email ?? "").trim().toLowerCase();
  if (!email || !maySyncZohoEmail(email)) throw new Skip("no email Zoho can use");
  if (lead.do_not_contact) throw new Skip("do not contact");
  const how = input.source.replaceAll("_", " ");
  const zohoLeadId = await createZohoSalesEnquiry(
    {
      Company: "Household enquiry",
      Description: [`Added by hand in Mundoria admin by ${input.addedBy} (${how}).`, input.notes?.trim() || null]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000),
      Email: email,
      Enquiry_Date: ukDate(),
      Enquiry_Status: CRM_ENQUIRY_STATUS.new,
      Enquiry_Type: CRM_ENQUIRY_TYPE.cleaning,
      First_Name: String(lead.first_name ?? "").slice(0, 40) || undefined,
      Last_Name: String(lead.last_name ?? "").slice(0, 80) || String(lead.first_name ?? "Lead").slice(0, 80),
      ...(HAND_ADDED_SOURCE[input.source] ? { Lead_Source: HAND_ADDED_SOURCE[input.source] } : {}),
      Lead_Status: CRM_LEAD_STATUS.newUntouched,
      Phone: (lead.phone as string | null) || undefined,
      User_Type: CRM_USER_TYPE.customer,
      [config.keyField]: input.leadId,
    },
    config.ruleId,
    config.keyField,
  );
  await admin.from("zoho_sales_intake").upsert(
    {
      attempts: 1,
      callback_id: null,
      completed_at: new Date().toISOString(),
      last_error: null,
      lead_id: input.leadId,
      next_attempt_at: new Date().toISOString(),
      zoho_lead_id: zohoLeadId,
    },
    { onConflict: "lead_id" },
  );
}

/** The CRM lead made for this person's website callback (zoho_sales_intake). */
async function zohoSalesLeadId(leadId: string) {
  const { data } = await createAdminClient()
    .from("zoho_sales_intake")
    .select("zoho_lead_id,completed_at")
    .eq("lead_id", leadId)
    .maybeSingle();
  const id = (data?.zoho_lead_id as string | null | undefined) ?? null;
  if (id) return id;
  // The Sales lead is still being created: try again later, don't drop it.
  if (data && !data.completed_at) throw new Error("Zoho sales lead not created yet");
  throw new Skip("no Zoho sales lead for this person");
}

/**
 * The customer's Contact id, found by an email upsert. That also fills in a
 * Contact for a customer who signed up before the Zoho sync existed. The
 * latest name and phone come from Mundoria when the account still exists.
 */
async function contactId(person: Person) {
  let current = person;
  if (person.userId) {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("email,full_name,phone,role")
      .eq("id", person.userId)
      .maybeSingle();
    if (data?.role && data.role !== "customer") throw new Skip("not a customer");
    if (data?.email) current = { email: String(data.email), fullName: String(data.full_name ?? ""), phone: data.phone as string | null, userId: person.userId };
  }
  const email = current.email.trim().toLowerCase();
  if (!email || !maySyncZohoEmail(email)) throw new Skip("email not synced");
  return upsertZohoCrmRecordStrict("Contacts", {
    Email: email,
    ...zohoNameFields(current.fullName),
    Phone: current.phone?.trim() || undefined,
    User_Type: CRM_USER_TYPE.customer,
  });
}

/* ------------------------------------------------------------------ */
/* Helpers the routes call. Each builds the job(s) and never throws.   */
/* ------------------------------------------------------------------ */

/** Any change to a cleaner (admin decision, application, profile, documents). */
export function syncCleanerToZoho(cleanerId: string) {
  return queueZohoSync({ kind: "cleaner_snapshot", payload: { cleanerId } }).catch((error) => Sentry.captureException(error));
}

/** A note on the customer's Contact, by their Mundoria user id. */
export function noteCustomerInZoho(userId: string | null | undefined, title: string, content: string) {
  if (!userId) return Promise.resolve();
  return queueZohoSync({
    kind: "crm_note",
    payload: { content, target: { person: { email: "", fullName: "", userId }, type: "contact" }, title },
  }).catch((error) => Sentry.captureException(error));
}

/** A note on the person's website Sales lead (skipped when they have none). */
export function noteSalesLeadInZoho(leadId: string, title: string, content: string) {
  return queueZohoSync({
    kind: "crm_note",
    payload: { content, target: { leadId, type: "sales_lead" }, title },
  }).catch((error) => Sentry.captureException(error));
}

export function setSalesLeadStatusInZoho(leadId: string, leadStatus: string | null, enquiryStatus?: string | null) {
  return queueZohoSync({
    kind: "sales_lead_status",
    payload: { enquiryStatus: enquiryStatus ?? null, leadId, leadStatus },
  }).catch((error) => Sentry.captureException(error));
}

/**
 * An account deleted from admin. Cleaners: the Recruit candidate is closed.
 * Customers: a note on the Contact, plus Account_Status when the org has a
 * value for it (ZOHO_CRM_ACCOUNT_STATUS_DELETED; the stock list only has
 * Verified / Unverified, and an unlisted value would not match any filter).
 */
export function closeAccountInZoho(input: {
  email: string | null;
  fullName: string | null;
  reason: string;
  role: string | null;
}) {
  if (!input.email) return Promise.resolve();
  const person: Person = { email: input.email, fullName: input.fullName ?? "" };
  if (input.role === "cleaner") {
    return queueZohoSync({ kind: "candidate_closed", payload: { person, reason: input.reason } }).catch((error) =>
      Sentry.captureException(error),
    );
  }
  if (input.role !== "customer") return Promise.resolve();
  const deletedValue = process.env.ZOHO_CRM_ACCOUNT_STATUS_DELETED?.trim();
  return queueZohoSyncs([
    {
      kind: "crm_note",
      payload: {
        content: `The Mundoria account for ${input.email} was deleted by an admin. Reason: ${input.reason}`,
        target: { person, type: "contact" },
        title: "Mundoria account deleted",
      },
    },
    ...(deletedValue
      ? [{ kind: "contact_fields" as const, payload: { fields: { Account_Status: deletedValue }, person } }]
      : []),
  ]).catch((error) => Sentry.captureException(error));
}

/** A lead added by hand in admin: create their Sales lead in Zoho. */
export function createSalesLeadInZoho(input: { addedBy: string; leadId: string; notes?: string | null; source: string }) {
  return queueZohoSync({ kind: "sales_lead_create", payload: input }).catch((error) => Sentry.captureException(error));
}
