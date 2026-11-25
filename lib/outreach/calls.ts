/**
 * AI phone calls through Vapi (https://vapi.ai), placed from a saved assistant
 * on a saved phone number (a Twilio number imported into Vapi works).
 * The assistant itself (voice, prompt, transfer-to-human, structured outcome)
 * is configured in the Vapi dashboard; see docs/lead-automation-playbook.md.
 */

import { isMetaOfferSource } from "@/lib/bookings/percent-offer";
import * as Sentry from "@sentry/nextjs";

import { alertAdmins } from "@/lib/notifications/admin";
import { channelBlocked, sendLeadEmail, sendLeadSms } from "@/lib/outreach/channels";
import {
  appUrl,
  callsConfigured,
  MAX_CALL_ATTEMPTS,
  toE164,
  withinSendingHours,
} from "@/lib/outreach/config";
import {
  advanceStatus,
  getLead,
  leadName,
  logLeadEvent,
  optOutLead,
  updateLead,
  type LeadRow,
} from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

const VAPI_API = "https://api.vapi.ai";

/** Outcomes the Vapi assistant reports in analysis.structuredData.outcome. */
export const CALL_OUTCOMES = [
  "wants_to_book",
  "booking_link_requested",
  "callback_requested",
  "question_for_team",
  "not_interested",
  "do_not_contact",
  "voicemail",
  "no_conversation",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

const NOT_CONNECTED = /no-answer|did-not-answer|busy|voicemail|failed|error|not-found|invalid|silence-timed-out/i;

export async function startLeadCall(lead: LeadRow, purpose: string, enrollmentId?: string | null) {
  const admin = createAdminClient();
  const skip = async (reason: string) => {
    await logLeadEvent(lead.id, "call.skipped", `AI call skipped: ${reason}`, { enrollmentId, purpose });
    return { ok: false, reason };
  };

  if (!callsConfigured()) return skip("calls_not_configured");
  const blocked = await channelBlocked(lead, "call");
  if (blocked) return skip(blocked);
  if (!withinSendingHours()) return skip("outside_calling_hours");
  const { count } = await admin
    .from("outreach_calls")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .neq("status", "failed");
  if ((count ?? 0) >= MAX_CALL_ATTEMPTS) return skip(`already_called_${count}_times`);

  const { data: row } = await admin
    .from("outreach_calls")
    .insert({ lead_id: lead.id, purpose, status: "queued" })
    .select("id")
    .single();

  try {
    const response = await fetch(`${VAPI_API}/call`, {
      body: JSON.stringify({
        assistantId: process.env.VAPI_ASSISTANT_ID,
        assistantOverrides: {
          metadata: { callRowId: row?.id, leadId: lead.id },
          variableValues: {
            bookingUrl: `${appUrl()}/booking/new`,
            firstName: lead.first_name || "there",
            offerEligible: /free|book-2-get-1|1h/i.test(lead.source) ? "yes" : "no",
            // 20% off the first clean (Meta page); see the playbook for the prompt line.
            percentOffer: isMetaOfferSource(lead.source) ? "yes" : "no",
            purpose,
            source: lead.source,
          },
        },
        customer: { name: leadName(lead) || undefined, number: toE164(lead.phone ?? "") },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      }),
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: unknown; status?: string };
    if (!response.ok || !payload.id) {
      const error = typeof payload.message === "string" ? payload.message : `HTTP ${response.status}`;
      await admin.from("outreach_calls").update({ error, status: "failed" }).eq("id", row?.id);
      await logLeadEvent(lead.id, "call.failed", `AI call could not start: ${error}`);
      return { ok: false, reason: error };
    }
    await admin
      .from("outreach_calls")
      .update({ provider_call_id: payload.id, status: payload.status ?? "queued" })
      .eq("id", row?.id);
    await logLeadEvent(lead.id, "call.started", `AI call placed (${purpose})`, { vapiCallId: payload.id });
    return { ok: true };
  } catch (error) {
    Sentry.captureException(error);
    await admin.from("outreach_calls").update({ error: String(error), status: "failed" }).eq("id", row?.id);
    return { ok: false, reason: String(error) };
  }
}

/** Accepts Vapi's Bearer credential or the legacy X-Vapi-Secret header. */
export function vapiRequestAuthorized(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${secret}` || request.headers.get("x-vapi-secret") === secret;
}

type VapiMessage = {
  analysis?: VapiAnalysis;
  artifact?: { recording?: { url?: string; stereoUrl?: string } | string; recordingUrl?: string; transcript?: string };
  call?: { analysis?: VapiAnalysis; endedAt?: string; id?: string; startedAt?: string };
  durationSeconds?: number;
  endedReason?: string;
  recordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
  status?: string;
  summary?: string;
  transcript?: string;
  type?: string;
};
type VapiAnalysis = {
  structuredData?: { callback_time?: string; notes?: string; outcome?: string };
  successEvaluation?: unknown;
  summary?: string;
};

export async function handleVapiEvent(body: { message?: VapiMessage }) {
  const message = body.message;
  const callId = message?.call?.id;
  if (!message || !callId) return { ignored: true };
  const admin = createAdminClient();
  const { data: call } = await admin
    .from("outreach_calls")
    .select("id,lead_id,status")
    .eq("provider_call_id", callId)
    .maybeSingle();
  if (!call) return { ignored: true };

  if (message.type === "status-update" && message.status) {
    await admin.from("outreach_calls").update({ status: message.status }).eq("id", call.id);
    return { ok: true };
  }
  if (message.type !== "end-of-call-report") return { ignored: true };

  const analysis = message.analysis ?? message.call?.analysis ?? {};
  const outcome = (analysis.structuredData?.outcome ?? "") as CallOutcome | "";
  const recording =
    message.artifact?.recordingUrl ??
    message.recordingUrl ??
    (typeof message.artifact?.recording === "string"
      ? message.artifact.recording
      : message.artifact?.recording?.url ?? message.artifact?.recording?.stereoUrl);
  const startedAt = message.startedAt ?? message.call?.startedAt;
  const endedAt = message.endedAt ?? message.call?.endedAt ?? new Date().toISOString();
  const duration =
    message.durationSeconds ??
    (startedAt ? Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000)) : null);
  const endedReason = message.endedReason ?? "";
  const connected =
    !NOT_CONNECTED.test(endedReason) && outcome !== "voicemail" && outcome !== "no_conversation" && (duration ?? 0) >= 15;

  await admin
    .from("outreach_calls")
    .update({
      duration_seconds: duration,
      ended_at: endedAt,
      ended_reason: endedReason || null,
      outcome: outcome || (connected ? "connected" : "not_connected"),
      recording_url: recording ?? null,
      status: "ended",
      summary: analysis.summary ?? message.summary ?? null,
      transcript: (message.artifact?.transcript ?? message.transcript ?? "").slice(0, 20000) || null,
    })
    .eq("id", call.id);

  let lead = await getLead(call.lead_id as string);
  if (!lead) return { ok: true };
  await logLeadEvent(
    lead.id,
    "call.ended",
    `AI call ended: ${outcome || (connected ? "spoke" : "no answer")}${analysis.summary ? `. ${analysis.summary}` : ""}`,
    { duration, endedReason, outcome },
  );

  if (connected) {
    lead = await advanceStatus(lead, "engaged");
    // Tell the running journey not to call again.
    const { data: active } = await admin
      .from("outreach_enrollments")
      .select("id,context")
      .eq("lead_id", lead.id)
      .eq("status", "active");
    for (const row of active ?? []) {
      await admin
        .from("outreach_enrollments")
        .update({ context: { ...(row.context as object), callConnected: true } })
        .eq("id", row.id);
    }
  }

  const name = leadName(lead) || lead.phone || "A lead";
  const bookingUrl = `${appUrl()}/booking/new?utm_source=ai_call`;
  switch (outcome) {
    case "wants_to_book":
    case "booking_link_requested":
      await sendLeadSms(lead, `Thanks for the chat${lead.first_name ? `, ${lead.first_name}` : ""}. Here's your booking link: ${bookingUrl}`, { isReply: true });
      await sendLeadEmail(
        lead,
        {
          actionLabel: "Book your clean",
          actionUrl: bookingUrl,
          body: "Thanks for speaking with us. Here's the link to book your clean; it only takes a couple of minutes. Reply to this email if anything's unclear.",
          subject: "Your booking link",
        },
        { isReply: true },
      );
      break;
    case "callback_requested":
    case "question_for_team":
      await updateLead(lead, {
        needs_human: true,
        needs_human_reason:
          outcome === "callback_requested"
            ? `Wants a call from the team${analysis.structuredData?.callback_time ? ` (${analysis.structuredData.callback_time})` : ""}`
            : `Question for the team: ${analysis.structuredData?.notes ?? analysis.summary ?? "see call"}`,
      });
      await alertAdmins(
        "lead.needs_human",
        `${name} needs a person to call them`,
        analysis.summary ??
          "The automated call ended and they still need someone from the team.",
        { leadId: lead.id, link: `${appUrl()}/admin/leads/${lead.id}` },
        { area: isMetaOfferSource(lead.source) ? "meta_leads" : "leads" },
      );
      break;
    case "not_interested":
      await updateLead(lead, { status: "lost" }, { summary: "Not interested (AI call)", type: "lead.status" });
      await admin
        .from("outreach_enrollments")
        .update({ status: "stopped", stop_reason: "not_interested", updated_at: new Date().toISOString() })
        .eq("lead_id", lead.id)
        .eq("status", "active");
      break;
    case "do_not_contact":
      await optOutLead(lead, "all", "Asked not to be contacted on an AI call");
      break;
    default:
      break;
  }
  return { ok: true };
}
