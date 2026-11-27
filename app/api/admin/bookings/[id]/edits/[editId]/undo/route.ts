import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { holdNeedsReplacing } from "@/lib/bookings/apply-booking-edit";
import { planUndo, undoBookingEdit } from "@/lib/bookings/undo-booking-edit";

const schema = z.object({
  cleanerAgreed: z.boolean().optional(),
  note: z.string().trim().min(3),
  preview: z.boolean().optional(),
});

/** Undo an edit to a booking. `preview: true` shows what would change back. */
export async function POST(
  request: Request,
  { params }: { params: { editId: string; id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give a reason for undoing this edit." }, { status: 400 });
  }
  const { cleanerAgreed, note, preview } = parsed.data;

  if (preview) {
    const planned = await planUndo(auth.admin, params.editId, { cleanerAgreed });
    if ("error" in planned) return NextResponse.json({ error: planned.error }, { status: 400 });
    if (planned.edit.booking_id !== params.id) {
      return NextResponse.json({ error: "That edit belongs to another booking." }, { status: 400 });
    }
    return NextResponse.json({
      changes: planned.plan.changes,
      cleanerMustReconfirm: planned.plan.cleanerMustReconfirm,
      holdNeedsReplacing: holdNeedsReplacing(planned.booking, planned.plan),
      newTotalPence: planned.plan.newTotalPence,
      oldTotalPence: planned.plan.oldTotalPence,
    });
  }

  const { data: edit } = await auth.admin
    .from("booking_edits")
    .select("booking_id")
    .eq("id", params.editId)
    .maybeSingle();
  if (!edit || edit.booking_id !== params.id) {
    return NextResponse.json({ error: "That edit wasn't found on this booking." }, { status: 404 });
  }

  const result = await undoBookingEdit(auth.admin, {
    adminId: auth.user.id,
    cleanerAgreed,
    editId: params.editId,
    reason: note,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await logAdminAction({
    action: "undo_booking_edit",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "booking",
    metadata: { changes: result.changes, editId: params.editId },
    reason: note,
  });
  return NextResponse.json({ success: true });
}
