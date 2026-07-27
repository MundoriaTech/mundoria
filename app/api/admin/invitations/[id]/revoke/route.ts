import { NextResponse } from "next/server";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await auth.admin
    .from("admin_invitations")
    .update({ revoked_at: new Date().toISOString(), status: "revoked" })
    .eq("id", params.id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    action: "admin_invitation_revoked",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "admin_invitation",
    reason: "Admin revoked invitation",
  });

  return NextResponse.json({ success: true });
}
