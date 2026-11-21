import * as Sentry from "@sentry/nextjs";

import { bookingDraftResumeUrl } from "@/lib/bookings/drafts";
import { alertAdmins } from "@/lib/notifications/admin";
import { startLeadCall } from "@/lib/outreach/calls";
import { sendLeadEmail, sendLeadSms, sendStaffSms } from "@/lib/outreach/channels";
import {
  appUrl,
  nextSendingTime,
  normalizeEmail,
  onCallPhone,
  outreachEnabled,
  WEEKLY_TOUCH_LIMIT,
  withinSendingHours,
} from "@/lib/outreach/config";
import { JOURNEYS, stepDelay, type JourneyContext, type JourneyId } from "@/lib/outreach/journeys";
import {
  advanceStatus,
  CONSENT_WORDING,
  getLead,
  leadName,
  logLeadEvent,
  recordConsent,
  updateLead,
  upsertLead,
  type LeadRow,
} from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueZohoSalesEnquiry } from "@/lib/zoho/sales-intake";

type EnrollmentRow = {
  context: JourneyContext;
  created_at: string;
  id: string;
  journey: JourneyId;
  lead_id: string;
  next_run_at: string;
  status: string;
  step_index: number;
};

const ENROLLMENT_COLUMNS = "id,lead_id,journey,step_index,status,next_run_at,context,created_at";
const minutes = (n: number) => n * 60 * 1000;

/** Start a journey for a lead unless one is already running (or it already ran, when `once`). */
export async function enrollLead(
  lead: LeadRow,
  journey: JourneyId,
  context: JourneyContext = {},
  options: { exclusive?: boolean; once?: boolean; startDelayMinutes?: number } = {},
) {
  const admin = createAdminClient();
  if (options.exclusive) {
    // Never run two journeys at once for the same person.
    const { count } = await admin
      .from("outreach_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("status", "active");
    if (count) return null;
  }
  const existing = admin
    .from("outreach_enrollments")
    .select("id,status")
    .eq("lead_id", lead.id)
    .eq("journey", journey);
  const { data: rows } = options.once ? await existing.limit(1) : await existing.eq("status", "active").limit(1);
  if (rows?.length) return null;

  const definition = JOURNEYS[journey];
  const ctx: JourneyContext = { firstName: lead.first_name ?? undefined, source: lead.source, ...context };
  const firstDelay = (options.startDelayMinutes ?? 0) + stepDelay(definition.steps[0], ctx);
  const { data, error } = await admin
    .from("outreach_enrollments")
    .insert({
      context: ctx,
      journey,
      lead_id: lead.id,
      next_run_at: new Date(Date.now() + minutes(firstDelay)).toISOString(),
    })
    .select(ENROLLMENT_COLUMNS)
    .single();
  if (error || !data) return null;
  await logLeadEvent(lead.id, "journey.started", `Started "${definition.label}" follow-ups`, { journey });
  return data as EnrollmentRow;
}

export async function stopEnrollments(leadId: string, reason: string, exceptJourney?: JourneyId) {
  let query = createAdminClient()
    .from("outreach_enrollments")
    .update({ status: "stopped", stop_reason: reason, updated_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("status", "active");
  if (exceptJourney) query = query.neq("journey", exceptJourney);
  await query;
}

/** Process every due journey step. Called by the run-outreach cron (and right after a callback request). */
export async function runDueEnrollments(options: { leadId?: string; limit?: number } = {}) {
  if (!outreachEnabled()) return { processed: 0, skipped: "OUTREACH_ENABLED is not true" };
  const admin = createAdminClient();
  let query = admin
    .from("outreach_enrollments")
    .select(ENROLLMENT_COLUMNS)
    .eq("status", "active")
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true })
    .limit(options.limit ?? 40);
  if (options.leadId) query = query.eq("lead_id", options.leadId);
  const { data } = await query;

  let processed = 0;
  for (const enrollment of (data ?? []) as EnrollmentRow[]) {
    try {
      await runStep(enrollment);
      processed += 1;
    } catch (error) {
      Sentry.captureException(error);
      // Back off so one broken row doesn't block the queue.
      await admin
        .from("outreach_enrollments")
        .update({ next_run_at: new Date(Date.now() + minutes(30)).toISOString() })
        .eq("id", enrollment.id);
    }
  }
  return { processed };
}

async function runStep(enrollment: EnrollmentRow) {
  const admin = createAdminClient();
  const lead = await getLead(enrollment.lead_id);
  const finish = async (status: "completed" | "stopped", reason?: string) =>
    admin
      .from("outreach_enrollments")
      .update({ status, stop_reason: reason ?? null, updated_at: new Date().toISOString() })
      .eq("id", enrollment.id);
  const reschedule = async (when: Date) =>
    admin
      .from("outreach_enrollments")
      .update({ next_run_at: when.toISOString(), updated_at: new Date().toISOString() })
      .eq("id", enrollment.id);

  if (!lead) return finish("stopped", "lead_missing");
  if (lead.do_not_contact || lead.status === "unsubscribed") return finish("stopped", "opted_out");
  if (lead.status === "booked") return finish("stopped", "booked");
  if (lead.status === "lost") return finish("stopped", "lost");
  // Once they've written back, the conversation (AI or a person) takes over.
  if (lead.last_inbound_at && lead.last_inbound_at > enrollment.created_at) return finish("stopped", "replied");
  if (lead.automation_paused) return reschedule(new Date(Date.now() + minutes(60)));

  const definition = JOURNEYS[enrollment.journey];
  const step = definition?.steps[enrollment.step_index];
  if (!step) return finish("completed");

  const ctx: JourneyContext = { ...enrollment.context, firstName: lead.first_name ?? enrollment.context.firstName };
  const customerFacing = step.action !== "alert_staff";

  if (customerFacing && !withinSendingHours()) return reschedule(nextSendingTime());
  if (customerFacing && (await touchesThisWeek(lead.id)) >= WEEKLY_TOUCH_LIMIT) {
    await logLeadEvent(lead.id, "journey.deferred", `Weekly limit (${WEEKLY_TOUCH_LIMIT}) reached; next step tomorrow`);
    return reschedule(new Date(Date.now() + minutes(24 * 60)));
  }

  const skip = "when" in step && step.when && !step.when(ctx);
  let reached = false;
  if (!skip) {
    if (step.action === "alert_staff") {
      await alertStaffAboutLead(lead, ctx);
    } else if (step.action === "email") {
      reached = (await sendLeadEmail(lead, step.copy(ctx), { enrollmentId: enrollment.id })).ok;
    } else if (step.action === "sms") {
      reached = (await sendLeadSms(lead, step.copy(ctx), { enrollmentId: enrollment.id })).ok;
    } else if (step.action === "call") {
      reached = (await startLeadCall(lead, `${definition.label}: ${step.name}`, enrollment.id)).ok;
    }
  }
  if (reached) await advanceStatus(lead, "contacted");

  const nextIndex = enrollment.step_index + 1;
  const nextStep = definition.steps[nextIndex];
  if (!nextStep) {
    await finish("completed");
    // A journey that ends with no reply and no booking marks the lead lost.
    const fresh = await getLead(lead.id);
    if (fresh && (fresh.status === "new" || fresh.status === "contacted")) {
      const { count } = await admin
        .from("outreach_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("status", "active");
      if (!count) await updateLead(fresh, { status: "lost" }, { summary: "Follow-ups finished with no reply or booking", type: "lead.status" });
    }
    return;
  }
  await admin
    .from("outreach_enrollments")
    .update({
      next_run_at: new Date(Date.now() + minutes(stepDelay(nextStep, ctx))).toISOString(),
      step_index: nextIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id);
}

async function touchesThisWeek(leadId: string) {
  const since = new Date(Date.now() - minutes(7 * 24 * 60)).toISOString();
  const admin = createAdminClient();
  const [{ count: messages }, { count: calls }] = await Promise.all([
    admin
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("direction", "outbound")
      .eq("status", "sent")
      .eq("ai_generated", false)
      .gte("created_at", since),
    admin
      .from("outreach_calls")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .neq("status", "failed")
      .gte("created_at", since),
  ]);
  return (messages ?? 0) + (calls ?? 0);
}

export async function alertStaffAboutLead(lead: LeadRow, ctx: JourneyContext) {
  const name = leadName(lead) || "A new lead";
  const when = ctx.availableNow ? "is free to talk now" : "asked for a callback";
  const link = `${appUrl()}/admin/leads/${lead.id}`;
  await alertAdmins(
    "lead.callback_request",
    `Callback request: ${name}`,
    `${name} ${when}. Phone ${lead.phone ?? "not given"}, email ${lead.email ?? "not given"}. Source: ${lead.source}.`,
    { leadId: lead.id, link },
  );
  const onCall = onCallPhone();
  if (onCall) {
    await sendStaffSms(onCall, `Mundoria lead: ${name} ${when}. ${lead.phone ?? ""} ${link}`.slice(0, 300));
  }
  await logLeadEvent(lead.id, "staff.alerted", "Team alerted (admins + on-call phone)");
}

/* ---------------------------------------------------------------- sources */

/** Called from POST /api/callback-leads right after the row is saved. */
export async function captureCallbackLead(input: {
  availableIn10Min: boolean;
  callbackId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  source: string;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
}) {
  const placeholder = (value?: string) => (value && !["Guest", "Lead"].includes(value) ? value : null);
  const result = await upsertLead({
    email: input.email,
    firstName: placeholder(input.firstName),
    lastName: placeholder(input.lastName),
    phone: input.phone,
    source: input.source,
    utmCampaign: input.utmCampaign,
    utmMedium: input.utmMedium,
    utmSource: input.utmSource,
  });
  if (!result) return null;
  const { lead } = result;
  for (const channel of ["call", "sms", "email"] as const) {
    await recordConsent(lead.id, channel, true, "request", CONSENT_WORDING.callbackRequest, input.source);
  }
  const fresh = await updateLead(
    lead,
    { callback_requested_at: new Date().toISOString() },
    { summary: `Asked for a callback${input.availableIn10Min ? " (free in the next 10 minutes)" : ""}`, type: "lead.callback_request" },
  );
  if (!fresh.do_not_contact && fresh.status !== "unsubscribed") {
    try {
      await queueZohoSalesEnquiry(fresh.id, input.callbackId, input.email);
    } catch (error) {
      Sentry.captureException(error);
    }
  }
  // A new request replaces older, slower journeys.
  await stopEnrollments(fresh.id, "superseded_by_callback", "callback_request");
  const enrollment = await enrollLead(fresh, "callback_request", { availableNow: input.availableIn10Min, source: input.source });
  // Speed to lead: alert + (if free now) call immediately, not on the next cron tick.
  if (enrollment) await runDueEnrollments({ leadId: fresh.id, limit: 3 });
  return fresh;
}

/** Called after a customer account is created. */
export async function captureSignupLead(input: {
  email: string;
  fullName: string;
  marketingOptIn: boolean;
  phone?: string;
  profileId: string;
}) {
  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const result = await upsertLead({
    email: input.email,
    firstName,
    lastName: rest.join(" "),
    phone: input.phone,
    profileId: input.profileId,
    source: "signup",
  });
  if (!result) return;
  if (input.marketingOptIn) {
    await recordConsent(result.lead.id, "email", true, "opt_in", CONSENT_WORDING.marketingOptIn, "/signup");
    // First email a day after signup, only if they still haven't booked.
    await enrollLead(result.lead, "signup_no_booking", {}, { exclusive: true, once: true, startDelayMinutes: 24 * 60 });
  }
}

/** Pull in booking drafts left unfinished (replaces the old two-reminder cron). */
export async function syncDraftLeads(limit = 50) {
  const admin = createAdminClient();
  const olderThan = new Date(Date.now() - minutes(30)).toISOString();
  const newerThan = new Date(Date.now() - minutes(3 * 24 * 60)).toISOString();
  const { data } = await admin
    .from("booking_drafts")
    .select("id,email,resume_token,draft,marketing_opt_in,user_id,created_at,updated_at")
    .is("completed_at", null)
    .lt("updated_at", olderThan)
    .gt("created_at", newerThan)
    .order("created_at", { ascending: true })
    .limit(limit);

  let enrolled = 0;
  for (const draft of data ?? []) {
    const email = normalizeEmail(draft.email as string);
    if (!email) continue;
    const details = (draft.draft ?? {}) as { serviceType?: string };
    const result = await upsertLead({ email, profileId: (draft.user_id as string | null) ?? null, source: "booking_draft" });
    if (!result) continue;
    const { lead } = result;
    if (lead.status === "booked" || lead.do_not_contact) continue;
    if (result.created) {
      await recordConsent(lead.id, "email", true, "soft_opt_in", CONSENT_WORDING.bookingDraftSoftOptIn, "/booking/new");
      if (draft.marketing_opt_in) {
        await recordConsent(lead.id, "email", true, "opt_in", CONSENT_WORDING.marketingOptIn, "/booking/new");
      }
    }
    const started = await enrollLead(
      lead,
      "abandoned_quote",
      {
        resumeUrl: bookingDraftResumeUrl(draft.resume_token as string),
        serviceName: details.serviceType ? String(details.serviceType).replaceAll("_", " ") : undefined,
      },
      // Drafts are picked up 30+ minutes after they stopped; the first email follows 45 minutes later.
      { exclusive: true, once: true },
    );
    if (started) enrolled += 1;
  }
  return { enrolled };
}

/** Mark leads booked when a booking exists for their email or account; stop their follow-ups. */
export async function markBookedLeads() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - minutes(3 * 24 * 60)).toISOString();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id,customer_id,created_at,status,customer:profiles!bookings_customer_id_fkey(email)")
    .gte("created_at", since)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: true })
    .limit(200);

  let marked = 0;
  for (const booking of bookings ?? []) {
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    const email = normalizeEmail((customer as { email?: string } | null)?.email);
    let lead: LeadRow | null = null;
    if (booking.customer_id) {
      const { data } = await admin.from("leads").select("id").eq("profile_id", booking.customer_id).maybeSingle();
      if (data) lead = await getLead(data.id as string);
    }
    if (!lead && email) {
      const { data } = await admin.from("leads").select("id").ilike("email", email).maybeSingle();
      if (data) lead = await getLead(data.id as string);
    }
    if (!lead || lead.status === "booked") continue;
    if (booking.created_at < lead.created_at) continue;

    const { data: lastTouch } = await admin
      .from("outreach_messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("direction", "outbound")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    await updateLead(
      lead,
      {
        attributed_message_id: (lastTouch?.id as string | undefined) ?? null,
        booked_at: booking.created_at as string,
        booking_id: booking.id as string,
        needs_human: false,
        profile_id: lead.profile_id ?? (booking.customer_id as string | null),
        status: "booked",
      },
      { payload: { bookingId: booking.id }, summary: "Booked", type: "lead.booked" },
    );
    await stopEnrollments(lead.id, "booked");
    marked += 1;
  }
  return { marked };
}
