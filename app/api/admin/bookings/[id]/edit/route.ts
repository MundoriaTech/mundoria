import { NextResponse } from "next/server";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  bookingEditSchema,
  EDIT_BOOKING_SELECT,
  planBookingEdit,
  type EditableBooking,
} from "@/lib/admin/booking-edit";
import { applyBookingEdit, holdNeedsReplacing } from "@/lib/bookings/apply-booking-edit";

/**
 * Admin edit of a booking after it was made. `preview: true` returns what
 * would change (including the new price) without saving anything.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = bookingEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const { data: booking } = await auth.admin
    .from("bookings")
    .select(EDIT_BOOKING_SELECT)
    .eq("id", params.id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const current = booking as unknown as EditableBooking;

  const result = await planBookingEdit(auth.admin, current, input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { plan } = result;

  if (input.preview) {
    return NextResponse.json({
      changes: plan.changes,
      cleanerMustReconfirm: plan.cleanerMustReconfirm,
      holdNeedsReplacing: holdNeedsReplacing(current, plan),
      newCleanerPence: plan.newCleanerPence,
      newTotalPence: plan.newTotalPence,
      oldCleanerPence: plan.oldCleanerPence,
      oldTotalPence: plan.oldTotalPence,
    });
  }
  if (!plan.changes.length) {
    return NextResponse.json({ error: "Nothing has changed." }, { status: 400 });
  }

  const saved = await applyBookingEdit({ actor: "admin", admin: auth.admin, booking: current, plan });
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: saved.status });

  await logAdminAction({
    action: "edit_booking",
    adminId: auth.user.id,
    entityId: current.id,
    entityType: "booking",
    metadata: {
      changes: plan.changes,
      cleanerMustReconfirm: plan.cleanerMustReconfirm,
      newIntentId: saved.newIntentId,
      previousIntentId: saved.newIntentId ? current.stripe_payment_intent_id : null,
    },
    reason: input.note,
  });

  return NextResponse.json({
    changes: plan.changes,
    cleanerMustReconfirm: plan.cleanerMustReconfirm,
    success: true,
  });
}
