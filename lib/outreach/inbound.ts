import { alertAdmins } from "@/lib/notifications/admin";
import { decideReply } from "@/lib/outreach/ai";
import { sendLeadEmail, sendLeadSms } from "@/lib/outreach/channels";
import { aiReplyMode, appUrl } from "@/lib/outreach/config";
import {
  advanceStatus,
  findLead,
  leadName,
  logLeadEvent,
  optOutLead,
  recordConsent,
  updateLead,
  upsertLead,
  type LeadRow,
} from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

const SMS_STOP = /^\s*(stop|stopall|unsubscribe|cancel|end|quit|optout|opt out)\s*[.!]*\s*$/i;
const SMS_START = /^\s*(start|unstop|yes)\s*$/i;
const AI_EMAIL_NOTE =
  "This reply was written by Mundoria's assistant. Reply with \"person\" any time and a member of the team will pick it up.";

export async function handleInbound(input: {
  body: string;
  channel: "email" | "sms";
  from: string;
  fromName?: string;
  providerId?: string;
  subject?: string;
}) {
  const admin = createAdminClient();
  const text = input.body.trim();
  if (!text) return { ignored: "empty" };

  let lead = await findLead(input.channel === "email" ? { email: input.from } : { phone: input.from });
  if (!lead) {
    // Someone we haven't followed up wrote in; keep them so the team can see it.
    const created = await upsertLead({
      email: input.channel === "email" ? input.from : null,
      firstName: input.fromName?.split(/\s+/)[0] ?? null,
      phone: input.channel === "sms" ? input.from : null,
      source: `inbound_${input.channel}`,
    });
    if (!created) return { ignored: "unknown_sender" };
    lead = created.lead;
  }

  // Twilio already confirms STOP/START on its side; we mirror the consent.
  if (input.channel === "sms" && SMS_STOP.test(text)) {
    await logInbound(lead, input, null);
    await optOutLead(lead, "sms", `Texted "${text}"`);
    return { optedOut: true };
  }
  if (input.channel === "sms" && SMS_START.test(text)) {
    await logInbound(lead, input, null);
    await recordConsent(lead.id, "sms", true, "opt_in", `Texted "${text}" to resubscribe`);
    return { resubscribed: true };
  }

  await logInbound(lead, input, null);
  lead = await updateLead(lead, { last_inbound_at: new Date().toISOString() });
  // A reply ends the timed journey; the conversation continues here.
  await admin
    .from("outreach_enrollments")
    .update({ status: "stopped", stop_reason: "replied", updated_at: new Date().toISOString() })
    .eq("lead_id", lead.id)
    .eq("status", "active");

  const wantsPerson = /^\s*(person|human|agent|call me)\b/i.test(text);
  const history = await recentHistory(lead.id);
  const decision = wantsPerson
    ? null
    : await decideReply({
        channel: input.channel,
        customerName: leadName(lead),
        history,
        inbound: input.subject ? `Subject: ${input.subject}\n\n${text}` : text,
        source: lead.source,
      });

  if (!decision) {
    await handOver(lead, wantsPerson ? "Asked for a person" : "AI unavailable; needs a reply", text);
    return { handover: true };
  }

  await admin
    .from("outreach_messages")
    .update({ ai_intent: decision.intent })
    .eq("lead_id", lead.id)
    .eq("direction", "inbound")
    .eq("provider_id", input.providerId ?? "__none__");
  await logLeadEvent(lead.id, "ai.decision", decision.summary, { intent: decision.intent });

  const send = async (reply: string) => {
    if (!reply.trim()) return;
    if (input.channel === "sms") {
      await sendLeadSms(lead!, reply, { aiGenerated: true, aiIntent: decision.intent, isReply: true });
    } else {
      await sendLeadEmail(
        lead!,
        {
          body: `${reply}\n\n${AI_EMAIL_NOTE}`,
          subject: input.subject ? (/^re:/i.test(input.subject) ? input.subject : `Re: ${input.subject}`) : "Re: your message to Mundoria",
        },
        { aiGenerated: true, aiIntent: decision.intent, isReply: true },
      );
    }
  };

  if (decision.intent === "opt_out") {
    await send(
      input.channel === "sms"
        ? "Done. You won't get any more messages from Mundoria."
        : "You're unsubscribed and won't hear from us again about this. Thanks for letting us know.",
    );
    await optOutLead(lead, "all", "Asked to stop (reply)");
    return { optedOut: true };
  }

  if (decision.intent === "not_interested") {
    await send(decision.reply);
    await updateLead(lead, { status: "lost" }, { summary: "Not interested (reply)", type: "lead.status" });
    return { lost: true };
  }

  await advanceStatus(lead, "engaged");

  if (decision.handover) {
    // A holding reply is fine in auto mode; the person follows up.
    if (aiReplyMode() === "auto") await send(decision.reply);
    await handOver(lead, decision.handover_reason || "AI asked for a person", text);
    return { handover: true };
  }

  if (aiReplyMode() === "review") {
    await logLeadEvent(lead.id, "ai.draft", "AI drafted a reply for approval", {
      channel: input.channel,
      reply: decision.reply,
      subject: input.subject ?? null,
    });
    await handOver(lead, "AI reply waiting for approval", text);
    return { drafted: true };
  }

  await send(decision.reply);
  return { replied: true };
}

async function logInbound(
  lead: LeadRow,
  input: { body: string; channel: "email" | "sms"; providerId?: string; subject?: string },
  intent: string | null,
) {
  await createAdminClient().from("outreach_messages").insert({
    ai_intent: intent,
    body: input.body.slice(0, 10000),
    channel: input.channel,
    direction: "inbound",
    lead_id: lead.id,
    provider_id: input.providerId ?? null,
    status: "received",
    subject: input.subject ?? null,
  });
}

async function recentHistory(leadId: string) {
  const { data } = await createAdminClient()
    .from("outreach_messages")
    .select("direction,body,status,created_at")
    .eq("lead_id", leadId)
    .in("status", ["sent", "received"])
    .order("created_at", { ascending: false })
    .limit(9);
  // The newest inbound is the message being answered; it's passed separately.
  return (data ?? [])
    .slice(1)
    .reverse()
    .map((row) => ({ direction: row.direction as "inbound" | "outbound", text: String(row.body).slice(0, 1500) }));
}

async function handOver(lead: LeadRow, reason: string, text: string) {
  await updateLead(
    lead,
    { needs_human: true, needs_human_reason: reason },
    { summary: `Needs a person: ${reason}`, type: "lead.handover" },
  );
  await alertAdmins(
    "lead.needs_human",
    `${leadName(lead) || lead.email || lead.phone || "Someone"} needs a reply`,
    `${reason}. They wrote: “${text.slice(0, 280)}”`,
    { leadId: lead.id, link: `${appUrl()}/admin/leads/${lead.id}` },
  );
}
