import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { adminAddExtraTime } from "@/lib/bookings/extra-time";

const schema = z.object({
  minutes: z.number().int().min(15).max(240),
  note: z.string().trim().min(3, "Say how the customer agreed."),
});

/** Admin records extra time the customer agreed to (e.g. on the phone). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details." },
      { status: 400 },
    );
  }
  try {
    const result = await adminAddExtraTime({
      adminId: auth.user.id,
      bookingId: params.id,
      minutes: parsed.data.minutes,
      note: parsed.data.note,
    });
    await logAdminAction({
      action: "booking.extra_time",
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "booking",
      metadata: { amount: result.amount, minutes: parsed.data.minutes },
      reason: parsed.data.note,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't add the time." },
      { status: 400 },
    );
  }
}
