import { NextResponse } from "next/server";
import { z } from "zod";

import { adminAccessFor } from "@/lib/admin/access";
import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  logLeadEvent,
  recordConsent,
  updateLead,
  upsertLead,
  type Channel,
} from "@/lib/outreach/leads";
import { createSalesLeadInZoho, noteSalesLeadInZoho } from "@/lib/zoho/sync-jobs";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    consent: z
      .object({
        call: z.boolean().default(false),
        email: z.boolean().default(false),
        sms: z.boolean().default(false),
      })
      .default({}),
    consentNote: z.string().trim().max(300).optional().default(""),
    email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
    firstName: z.string().trim().min(1, "Enter a first name.").max(80),
    lastName: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(2000).optional().default(""),
    phone: z.string().trim().max(30).optional().default(""),
    source: z.enum(["phone_call", "walk_in", "referral", "event", "social_media", "other"]),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Add an email address or a phone number.",
    path: ["email"],
  })
  .refine(
    (value) =>
      !(value.consent.email || value.consent.sms || value.consent.call) ||
      value.consentNote.length >= 3,
    { message: "Say how they agreed to be contacted.", path: ["consentNote"] },
  );

/**
 * Add a lead by hand (phone call, walk-in, referral…). No follow-ups start
 * automatically; a person starts a journey from the lead page. Consent is
 * recorded only for the channels the admin ticks, with how it was given.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await adminAccessFor(auth.profile.email)).leads) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const result = await upsertLead({
    email: input.email || null,
    firstName: input.firstName,
    lastName: input.lastName || null,
    phone: input.phone || null,
    source: `admin_${input.source}`,
  });
  if (!result) {
    return NextResponse.json(
      { error: "Enter a valid email address or UK phone number." },
      { status: 400 },
    );
  }
  const { created, lead } = result;
  const who = auth.profile.full_name ?? "admin";

  if (created) {
    await updateLead(
      lead,
      {
        notes: input.notes || null,
        owner_id: auth.profile.id,
      },
      {
        actorId: auth.profile.id,
        summary: `${who} added this lead by hand (${input.source.replaceAll("_", " ")})`,
        type: "admin.created",
      },
    );
  } else if (input.notes) {
    await logLeadEvent(
      lead.id,
      "admin.note",
      `${who} tried to add this lead again and left a note: ${input.notes}`,
      {},
      auth.profile.id,
    );
  }

  const channels = (["email", "sms", "call"] as Channel[]).filter(
    (channel) => input.consent[channel],
  );
  for (const channel of channels) {
    await recordConsent(lead.id, channel, true, "admin", `${who}: ${input.consentNote}`);
  }
  if (channels.length) {
    await logLeadEvent(
      lead.id,
      "admin.consent",
      `${who} recorded consent for ${channels.join(", ")}: ${input.consentNote}`,
      { channels },
      auth.profile.id,
    );
  }

  // Zoho: a new hand-added lead becomes a Sales lead; a repeat adds a note.
  if (created) {
    await createSalesLeadInZoho({ addedBy: who, leadId: lead.id, notes: input.notes || null, source: input.source });
  } else if (input.notes) {
    await noteSalesLeadInZoho(lead.id, "Mundoria lead note", `${who} added a note: ${input.notes}`);
  }

  await logAdminAction({
    action: created ? "lead.create" : "lead.create_existing",
    adminId: auth.profile.id,
    entityId: lead.id,
    entityType: "lead",
    metadata: { channels, source: input.source },
  });

  return NextResponse.json({ created, id: lead.id });
}
