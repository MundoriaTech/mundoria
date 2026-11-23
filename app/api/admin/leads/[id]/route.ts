import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { alertAdmins } from "@/lib/notifications/admin";
import { startLeadCall } from "@/lib/outreach/calls";
import { sendLeadEmail, sendLeadSms } from "@/lib/outreach/channels";
import { appUrl } from "@/lib/outreach/config";
import { enrollLead, runDueEnrollments, stopEnrollments } from "@/lib/outreach/engine";
import { JOURNEYS, type JourneyId } from "@/lib/outreach/journeys";
import { getLead, leadName, logLeadEvent, recordConsent, updateLead } from "@/lib/outreach/leads";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  automationPaused: z.boolean().optional(),
  doNotContact: z.boolean().optional(),
  needsHuman: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  status: z.enum(["new", "contacted", "engaged", "booked", "lost", "unsubscribed"]).optional(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send_message"),
    body: z.string().trim().min(1).max(4000),
    channel: z.enum(["email", "sms"]),
    subject: z.string().trim().max(200).optional(),
  }),
  z.object({ action: z.literal("call_now") }),
  z.object({
    action: z.literal("approve_draft"),
    eventId: z.string().uuid(),
    reply: z.string().trim().min(1).max(4000),
  }),
  z.object({ action: z.literal("start_journey"), journey: z.enum(Object.keys(JOURNEYS) as [JourneyId, ...JourneyId[]]) }),
  z.object({ action: z.literal("stop_journeys") }),
  z.object({
    action: z.literal("record_consent"),
    channel: z.enum(["email", "sms", "call"]),
    granted: z.boolean(),
    note: z.string().trim().min(3).max(500),
  }),
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const lead = await getLead(params.id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const input = parsed.data;
  const patch: Parameters<typeof updateLead>[1] = {};
  if (input.status) patch.status = input.status;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId;
  if (input.automationPaused !== undefined) patch.automation_paused = input.automationPaused;
  if (input.doNotContact !== undefined) patch.do_not_contact = input.doNotContact;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.needsHuman === false) {
    patch.needs_human = false;
    patch.needs_human_reason = null;
  }

  const next = await updateLead(lead, patch, {
    actorId: auth.profile.id,
    payload: input,
    summary: `Updated by ${auth.profile.full_name ?? "admin"}: ${Object.keys(input).join(", ")}`,
    type: "admin.update",
  });
  if (input.status === "lost" || input.status === "booked" || input.doNotContact) {
    await stopEnrollments(lead.id, `admin_${input.status ?? "do_not_contact"}`);
  }
  await logAdminAction({
    action: "lead.update",
    adminId: auth.profile.id,
    entityId: lead.id,
    entityType: "lead",
    metadata: input,
  });

  const important =
    input.status === "booked" ||
    input.status === "lost" ||
    input.status === "unsubscribed" ||
    input.doNotContact === true;
  if (important) {
    const who = leadName(next) || next.email || next.phone || "This person";
    const summary = input.doNotContact
      ? `${who} should not be contacted again.`
      : input.status === "booked"
        ? `${who} has booked.`
        : input.status === "lost"
          ? `${who} is marked as not going ahead.`
          : input.status === "unsubscribed"
            ? `${who} has unsubscribed.`
            : `${who} was updated.`;
    void alertAdmins(
      "lead.updated",
      `${who} was updated`,
      `${summary} This was changed by ${auth.profile.full_name ?? "the team"}.`,
      {
        actionUrl: `${appUrl()}/admin/leads/${lead.id}`,
        email: next.email,
        leadId: lead.id,
        name: who,
        phone: next.phone,
      },
    );
  }

  return NextResponse.json({ lead: next });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const lead = await getLead(params.id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const input = parsed.data;
  const who = auth.profile.full_name ?? "admin";

  let result: { ok: boolean; reason?: string } = { ok: true };
  switch (input.action) {
    case "send_message":
    case "approve_draft": {
      const body = input.action === "send_message" ? input.body : input.reply;
      const channel =
        input.action === "send_message"
          ? input.channel
          : ((await draftChannel(lead.id, input.eventId)) ?? (lead.email ? "email" : "sms"));
      // A person writing to a lead is a direct reply when they wrote to us; otherwise consent applies.
      const isReply = Boolean(lead.last_inbound_at);
      result =
        channel === "email"
          ? await sendLeadEmail(
              lead,
              { body, subject: (input.action === "send_message" && input.subject) || "A message from Mundoria" },
              { isReply },
            )
          : await sendLeadSms(lead, body, { isReply });
      if (result.ok) {
        if (input.action === "approve_draft") {
          await logLeadEvent(lead.id, "ai.draft_sent", `${who} approved and sent the AI draft`, { eventId: input.eventId }, auth.profile.id);
        }
        await updateLead(lead, { needs_human: false, needs_human_reason: null }, {
          actorId: auth.profile.id,
          summary: `${who} sent a ${channel === "email" ? "email" : "text"}${input.action === "approve_draft" ? " (approved AI draft)" : ""}`,
          type: "admin.message",
        });
      }
      break;
    }
    case "call_now":
      result = await startLeadCall(lead, `Manual call by ${who}`);
      break;
    case "start_journey": {
      const enrollment = await enrollLead(lead, input.journey, {}, {});
      result = enrollment ? { ok: true } : { ok: false, reason: "That journey is already running for this lead." };
      if (enrollment) await runDueEnrollments({ leadId: lead.id, limit: 2 });
      break;
    }
    case "stop_journeys":
      await stopEnrollments(lead.id, `stopped_by_${auth.profile.id}`);
      await logLeadEvent(lead.id, "admin.update", `${who} stopped all follow-ups`, {}, auth.profile.id);
      break;
    case "record_consent":
      await recordConsent(lead.id, input.channel, input.granted, input.granted ? "admin" : "withdrawn", `${who}: ${input.note}`);
      await logLeadEvent(
        lead.id,
        "admin.consent",
        `${who} recorded ${input.channel} consent: ${input.granted ? "yes" : "no"} (${input.note})`,
        {},
        auth.profile.id,
      );
      break;
  }

  await logAdminAction({
    action: `lead.${input.action}`,
    adminId: auth.profile.id,
    entityId: lead.id,
    entityType: "lead",
    metadata: { ok: result.ok, reason: result.reason },
  });
  if (!result.ok) {
    return NextResponse.json({ error: friendlyReason(result.reason) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

async function draftChannel(leadId: string, eventId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data } = await createAdminClient()
    .from("lead_events")
    .select("payload")
    .eq("id", eventId)
    .eq("lead_id", leadId)
    .maybeSingle();
  const channel = (data?.payload as { channel?: string } | null)?.channel;
  return channel === "email" || channel === "sms" ? channel : null;
}

function friendlyReason(reason?: string) {
  const map: Record<string, string> = {
    calls_not_configured: "AI calling isn't set up yet (Vapi keys missing).",
    do_not_contact: "This lead asked not to be contacted.",
    email_not_configured: "Email sending isn't set up (RESEND_API_KEY).",
    no_call_consent: "No consent to call this person on record.",
    no_email: "This lead has no email address.",
    no_email_consent: "No consent to email this person on record.",
    no_phone: "This lead has no phone number.",
    no_sms_consent: "No consent to text this person on record.",
    outside_calling_hours: "Calls only go out during sending hours (UK time).",
    sms_not_configured: "Texting isn't set up (Twilio keys missing).",
    undeliverable_address: "That email address can't receive mail.",
  };
  if (!reason) return "That didn't work. Try again.";
  if (reason.startsWith("already_called")) return "The AI has already called this lead the maximum number of times.";
  return map[reason] ?? reason;
}
