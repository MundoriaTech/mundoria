import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

const schema = z.object({
  action: z.enum(["create", "toggle"]),
  id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  name: z.string().trim().min(2).optional(),
  postcode_prefixes: z.array(z.string().trim().min(1)).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid zone details" }, { status: 400 });
  const value = parsed.data;
  let entityId = value.id;
  if (value.action === "create") {
    const { data, error } = await auth.admin
      .from("zones")
      .insert({
        is_active: true,
        launch_date: new Date().toISOString().slice(0, 10),
        name: value.name,
        postcode_prefixes: value.postcode_prefixes?.map((prefix) => prefix.toUpperCase()),
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    entityId = data.id;
  } else {
    await auth.admin.from("zones").update({ is_active: value.is_active }).eq("id", value.id);
  }
  await logAdminAction({
    action: `zone_${value.action}`,
    adminId: auth.user.id,
    entityId,
    entityType: "zone",
    metadata: value,
    reason: value.action,
  });
  return NextResponse.json({ success: true });
}
