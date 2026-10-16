import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import type { SupportConversationWithUser } from "@/types/support";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = auth.admin
    .from("support_conversations")
    .select(
      "id,user_id,guest_token,guest_name,guest_email,status,subject,last_message_at,last_message_preview,unread_admin,unread_user,created_at,updated_at,user:profiles!support_conversations_user_id_fkey(id,full_name,email)",
    )
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (status === "open" || status === "closed") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Could not load inbox." },
      { status: 500 },
    );
  }

  const conversations = ((data ?? []) as Array<
    SupportConversationWithUser & {
      user:
        | SupportConversationWithUser["user"]
        | SupportConversationWithUser["user"][];
    }
  >).map((row) => ({
    ...row,
    user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
  }));

  return NextResponse.json({ conversations });
}
