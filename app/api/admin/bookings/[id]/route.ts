import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

const schema = z.object({
  action: z.enum(["reassign", "status", "rematch"]),
  cleanerId: z.string().uuid().nullable().optional(),
  note: z.string().trim().min(3),
  status: z
    .enum([
      "pending_match",
      "matched",
      "confirmed",
      "cleaner_en_route",
      "in_progress",
      "awaiting_customer_confirmation",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const { action, cleanerId, note, status } = parsed.data;
  let updates: Record<string, unknown> = {};
  if (action === "reassign") {
    if (!cleanerId) return NextResponse.json({ error: "Choose a cleaner" }, { status: 400 });
    updates = { cleaner_id: cleanerId, status: "matched" };
    await auth.admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: cleanerId,
      decision: "admin_override_assignment",
      reasons: { note },
    });
  } else if (action === "rematch") {
    updates = {
      cleaner_id: null,
      status: "pending_match",
      checkin_override_requested: false,
      checkout_override_requested: false,
    };
    await auth.admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: null,
      decision: "replacement_requested",
      reasons: { note },
    });
  } else {
    if (!status) return NextResponse.json({ error: "Choose a status" }, { status: 400 });
    updates = { status };
  }
  const { error } = await auth.admin.from("bookings").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAdminAction({
    action,
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "booking",
    metadata: { cleanerId, status },
    reason: note,
  });
  return NextResponse.json({ success: true });
}
