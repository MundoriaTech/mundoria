import { NextResponse } from "next/server";
import { z } from "zod";

import {
  loadOwnedConversation,
  resolveSupportIdentity,
} from "@/lib/support/identity";
import { notifyAdminsOfSupportMessage } from "@/lib/support/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportMessage } from "@/types/support";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const identity = await resolveSupportIdentity(request);
  const conversation = await loadOwnedConversation(params.id, identity);
  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }

  if ((conversation.unread_user ?? 0) > 0) {
    await admin
      .from("support_conversations")
      .update({ unread_user: 0, updated_at: new Date().toISOString() })
      .eq("id", conversation.id);
  }

  return NextResponse.json({
    conversation: { ...conversation, unread_user: 0 },
    messages: (messages ?? []) as SupportMessage[],
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 },
    );
  }

  const identity = await resolveSupportIdentity(request);
  const conversation = await loadOwnedConversation(params.id, identity);
  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (conversation.status === "closed") {
    return NextResponse.json(
      { error: "This conversation is closed." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const content = parsed.data.content;
  const preview = content.slice(0, 140);

  const { data: message, error } = await admin
    .from("support_messages")
    .insert({
      content,
      conversation_id: conversation.id,
      sender_id: identity.user?.id ?? null,
      sender_type: "user",
    })
    .select("*")
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }

  await admin
    .from("support_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
      status: "open",
      unread_admin: (conversation.unread_admin ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversation.id);

  await notifyAdminsOfSupportMessage({
    conversationId: conversation.id,
    preview,
  });

  return NextResponse.json({ message });
}
