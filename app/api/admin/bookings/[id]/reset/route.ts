import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { holdNeedsReplacing } from "@/lib/bookings/apply-booking-edit";
import { planReset, resetBookingToOriginal } from "@/lib/bookings/undo-booking-edit";

const schema = z.object({
  cleanerAgreed: z.boolean().optional(),
  note: z.string().trim().min(3),
  preview: z.boolean().optional(),
});

/**
 * Put a booking back to what the customer originally booked, reversing every
 * edit still in force. `preview: true` shows what would change back.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give a reason for resetting this booking." }, { status: 400 });
  }
  const { cleanerAgreed, note, preview } = parsed.data;

  if (preview) {
    const planned = await planReset(auth.admin, params.id, { cleanerAgreed });
    if ("error" in planned) return NextResponse.json({ error: planned.error }, { status: 400 });
    return NextResponse.json({
      changes: planned.plan.changes,
      cleanerMustReconfirm: planned.plan.cleanerMustReconfirm,
      holdNeedsReplacing: holdNeedsReplacing(planned.booking, planned.plan),
      newTotalPence: planned.plan.newTotalPence,
      oldTotalPence: planned.plan.oldTotalPence,
    });
  }

  const result = await resetBookingToOriginal(auth.admin, {
    adminId: auth.user.id,
    bookingId: params.id,
    cleanerAgreed,
    reason: note,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await logAdminAction({
    action: "reset_booking",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "booking",
    metadata: { changes: result.changes },
    reason: note,
  });
  return NextResponse.json({ success: true });
}
