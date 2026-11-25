import { NextResponse } from "next/server";
import { z } from "zod";

import { adminAccessFor } from "@/lib/admin/access";
import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { isMetaOfferSource } from "@/lib/bookings/percent-offer";
import {
  CALLBACK_AREA_LABELS,
  CALLBACK_AREAS,
  CALLBACK_CALL_LABELS,
  CALLBACK_CALL_STATUSES,
  CALLBACK_OUTCOME_LABELS,
  CALLBACK_OUTCOMES,
  parseArea,
  parseCallStatus,
  parseOutcome,
} from "@/lib/admin/callback-desk";
import { notifyCallbackDeskChange } from "@/lib/admin/notify-callback-desk";
import { stopEnrollments } from "@/lib/outreach/engine";
import { findLead, updateLead } from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  area: z.enum(CALLBACK_AREAS).optional(),
  callStatus: z.enum(CALLBACK_CALL_STATUSES).optional(),
  notes: z.string().max(500).optional(),
  outcome: z.enum(CALLBACK_OUTCOMES).nullable().optional(),
  town: z.string().trim().max(80).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("callback_leads")
    .select(
      "id,first_name,last_name,phone,email,call_status,outcome,area,town,notes,source",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (loadError || !existing) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }
  // 20%-off (Meta) leads need meta_leads access; others need callback_leads.
  const access = await adminAccessFor(auth.profile.email);
  if (!access[isMetaOfferSource(existing.source as string) ? "meta_leads" : "callback_leads"]) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const input = parsed.data;
  let nextCall = input.callStatus ?? parseCallStatus(existing.call_status);
  const nextOutcome =
    input.outcome !== undefined ? input.outcome : parseOutcome(existing.outcome);
  let nextArea = input.area ?? parseArea(existing.area);
  const nextTown =
    input.town !== undefined
      ? input.town.trim() || null
      : ((existing.town as string | null) ?? null);
  const nextNotes =
    input.notes !== undefined
      ? input.notes.trim() || null
      : ((existing.notes as string | null) ?? null);

  if (nextOutcome === "out_of_area") nextArea = "out_of_area";
  if (
    input.callStatus === undefined &&
    nextOutcome &&
    nextOutcome !== "out_of_area" &&
    nextCall === "to_call"
  ) {
    nextCall = "spoke";
  }

  const patch: Record<string, unknown> = {
    area: nextArea,
    call_status: nextCall,
    notes: nextNotes,
    outcome: nextOutcome,
    town: nextTown,
    updated_at: new Date().toISOString(),
  };
  // Who wrote or edited the notes, only when the text actually changed.
  if (nextNotes !== ((existing.notes as string | null) ?? null)) {
    patch.notes_updated_at = new Date().toISOString();
    patch.notes_updated_by = auth.profile.id;
  }

  const { data: saved, error } = await admin
    .from("callback_leads")
    .update(patch)
    .eq("id", params.id)
    .select(
      "id,first_name,last_name,phone,email,call_status,outcome,area,town,notes,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at",
    )
    .single();

  if (error || !saved) {
    return NextResponse.json(
      { error: "Could not save that change." },
      { status: 500 },
    );
  }

  await logAdminAction({
    action: "callback_lead.update",
    adminId: auth.profile.id,
    entityId: params.id,
    entityType: "callback_lead",
    metadata: input,
  });

  const callChanged =
    parseCallStatus(existing.call_status) !== parseCallStatus(saved.call_status);
  const outcomeChanged =
    parseOutcome(existing.outcome) !== parseOutcome(saved.outcome);
  const areaChanged = parseArea(existing.area) !== parseArea(saved.area);
  const important =
    (callChanged && parseCallStatus(saved.call_status) === "spoke") ||
    outcomeChanged ||
    (areaChanged && parseArea(saved.area) === "out_of_area");

  if (outcomeChanged) {
    const mapped =
      nextOutcome === "customer"
        ? "booked"
        : nextOutcome === "pending_booking" || nextOutcome === "future_booking"
          ? "engaged"
          : nextOutcome === "closed" || nextOutcome === "out_of_area"
            ? "lost"
            : null;
    if (mapped) {
      const automation = await findLead({
        email: saved.email as string,
        phone: saved.phone as string,
      });
      if (automation) {
        await updateLead(
          automation,
          {
            status: mapped,
            ...(mapped === "booked"
              ? { booked_at: new Date().toISOString() }
              : {}),
          },
          {
            actorId: auth.profile.id,
            summary: `Callback desk set outcome to ${nextOutcome}`,
            type: "callback_desk.outcome",
          },
        );
        if (mapped === "booked" || mapped === "lost") {
          await stopEnrollments(automation.id, `callback_desk_${nextOutcome}`);
        }
      }
    }
  }

  // Someone spoke to them: a lead still at "new" is now "contacted".
  if (callChanged && parseCallStatus(saved.call_status) === "spoke" && !outcomeChanged) {
    const automation = await findLead({ email: saved.email as string, phone: saved.phone as string });
    if (automation && automation.status === "new") {
      await updateLead(
        automation,
        { status: "contacted" },
        { actorId: auth.profile.id, summary: "Callback desk: spoke to them", type: "callback_desk.spoke" },
      );
    }
  }

  if (important) {
    const bits = [
      callChanged
        ? `Call status is now “${CALLBACK_CALL_LABELS[parseCallStatus(saved.call_status)]}”`
        : null,
      outcomeChanged
        ? `Outcome is now “${
            parseOutcome(saved.outcome)
              ? CALLBACK_OUTCOME_LABELS[parseOutcome(saved.outcome)!]
              : "cleared"
          }”`
        : null,
      areaChanged
        ? `Area is now “${CALLBACK_AREA_LABELS[parseArea(saved.area)]}”`
        : null,
    ].filter(Boolean);
    void notifyCallbackDeskChange({
      actorEmail: auth.profile.email,
      actorName: auth.profile.full_name,
      lead: {
        email: saved.email as string,
        first_name: saved.first_name as string,
        id: saved.id as string,
        last_name: saved.last_name as string,
        phone: saved.phone as string,
      },
      source: existing.source as string,
      summary: bits.join(". "),
    });
  }

  return NextResponse.json({ ok: true, row: saved });
}
