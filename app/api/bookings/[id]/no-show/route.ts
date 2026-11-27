import { NextResponse } from "next/server";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { handleNoShow } from "@/lib/bookings/no-show";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  try {
    const result = await handleNoShow(params.id);
    await logAdminAction({
      action: "mark_no_show",
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "booking",
      metadata: {},
      reason: body.note?.trim() || "Marked as no-show",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No-show handling failed" },
      { status: 400 },
    );
  }
}
