import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import type { SupportConversation, SupportMessage } from "@/types/support";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  content: z.string().trim().min(1).max(4000).optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: conversation, error } = await auth.admin
    .from("support_conversations")
    .select(
      "*,user:profiles!support_conversations_user_id_fkey(id,full_name,email)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data: messages } = await auth.admin
    .from("support_messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  if ((conversation.unread_admin ?? 0) > 0) {
    await auth.admin
      .from("support_conversations")
      .update({ unread_admin: 0, updated_at: new Date().toISOString() })
      .eq("id", params.id);
  }

  const row = conversation as SupportConversation & {
    user:
      | { email: string | null; full_name: string | null; id: string }
      | Array<{ email: string | null; full_name: string | null; id: string }>
      | null;
  };

  return NextResponse.json({
    conversation: {
      ...row,
      unread_admin: 0,
      user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
    },
    messages: (messages ?? []) as SupportMessage[],
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = replySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: conversation } = await auth.admin
    .from("support_conversations")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let message: SupportMessage | null = null;

  if (parsed.data.content) {
    const content = parsed.data.content;
    const preview = content.slice(0, 140);
    const { data: inserted, error } = await auth.admin
      .from("support_messages")
      .insert({
        content,
        conversation_id: params.id,
        sender_id: auth.user.id,
        sender_type: "admin",
      })
      .select("*")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: "Could not send reply." },
        { status: 500 },
      );
    }
    message = inserted as SupportMessage;

    await auth.admin
      .from("support_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        status: parsed.data.status ?? "open",
        unread_admin: 0,
        unread_user: (conversation.unread_user ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    await logAdminAction({
      action: "support_reply",
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "support_conversation",
      metadata: { preview },
    });
  } else if (parsed.data.status) {
    await auth.admin
      .from("support_conversations")
      .update({
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    await logAdminAction({
      action: "support_status",
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "support_conversation",
      metadata: { status: parsed.data.status },
    });
  }

  return NextResponse.json({ message, ok: true });
}
