import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

const schema = z.object({
  cancellation_window_hours: z.number().int().min(0).max(72),
  geofence_radius_meters: z.number().int().min(50).max(5000),
  platform_commission_percent: z.number().min(0).max(100),
  support_email: z.string().email().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const { error } = await auth.admin
    .from("platform_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAdminAction({
    action: "update_platform_settings",
    adminId: auth.user.id,
    entityType: "settings",
    metadata: parsed.data,
    reason: "Platform settings update",
  });
  return NextResponse.json({ success: true });
}
