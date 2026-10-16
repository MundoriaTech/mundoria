import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupportGuestToken } from "@/lib/support/guest-token";
import { resolveSupportIdentity } from "@/lib/support/identity";
import { notifyAdminsOfSupportMessage } from "@/lib/support/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportConversation } from "@/types/support";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  guestEmail: z.string().trim().email().max(200).optional().nullable(),
  guestName: z.string().trim().min(1).max(120).optional().nullable(),
  guestToken: z.string().uuid().optional().nullable(),
});

export async function GET(request: Request) {
  const identity = await resolveSupportIdentity(request);
  if (!identity.user && !identity.guestToken) {
    return NextResponse.json({ conversations: [] });
  }

  const admin = createAdminClient();
  let query = admin
    .from("support_conversations")
    .select(
      "id,user_id,guest_token,guest_name,guest_email,status,subject,last_message_at,last_message_preview,unread_admin,unread_user,created_at,updated_at",
    )
    .order("last_message_at", { ascending: false })
    .limit(20);

  if (identity.user) {
    query = query.eq("user_id", identity.user.id);
  } else if (identity.guestToken) {
    query = query.eq("guest_token", identity.guestToken);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    conversations: (data ?? []) as SupportConversation[],
  });
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 },
    );
  }

  const identity = await resolveSupportIdentity(request);
  const guestToken =
    identity.guestToken ??
    (isSupportGuestToken(parsed.data.guestToken)
      ? parsed.data.guestToken
      : null);

  if (!identity.user && !guestToken) {
    return NextResponse.json(
      { error: "A guest session is required to message support." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const content = parsed.data.content;
  const preview = content.slice(0, 140);

  // Reuse the latest open thread when possible.
  let existingQuery = admin
    .from("support_conversations")
    .select("*")
    .eq("status", "open")
    .order("last_message_at", { ascending: false })
    .limit(1);

  if (identity.user) {
    existingQuery = existingQuery.eq("user_id", identity.user.id);
  } else {
    existingQuery = existingQuery.eq("guest_token", guestToken!);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  let conversation = existing as SupportConversation | null;

  if (!conversation) {
    const { data: created, error: createError } = await admin
      .from("support_conversations")
      .insert({
        guest_email: identity.user ? null : parsed.data.guestEmail ?? null,
        guest_name: identity.user ? null : parsed.data.guestName ?? null,
        guest_token: identity.user ? null : guestToken,
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        status: "open",
        unread_admin: 1,
        unread_user: 0,
        user_id: identity.user?.id ?? null,
      })
      .select("*")
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: "Could not start conversation." },
        { status: 500 },
      );
    }
    conversation = created as SupportConversation;
  } else {
    await admin
      .from("support_conversations")
      .update({
        guest_email:
          parsed.data.guestEmail ?? conversation.guest_email ?? null,
        guest_name: parsed.data.guestName ?? conversation.guest_name ?? null,
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        unread_admin: (conversation.unread_admin ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);
  }

  const isNewThread = !existing;
  const { data: message, error: messageError } = await admin
    .from("support_messages")
    .insert({
      content,
      conversation_id: conversation.id,
      sender_id: identity.user?.id ?? null,
      sender_type: "user",
    })
    .select("*")
    .single();

  if (messageError || !message) {
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }

  if (isNewThread) {
    await admin.from("support_messages").insert({
      content:
        "You're speaking with the Mundoria team. Share as much detail as you can and we'll help as soon as we can. For an active booking, in-app messaging is usually fastest.",
      conversation_id: conversation.id,
      sender_id: null,
      sender_type: "system",
    });
    await admin
      .from("support_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview:
          "You're speaking with the Mundoria team…",
        unread_user: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);
  }

  await notifyAdminsOfSupportMessage({
    conversationId: conversation.id,
    preview,
  });

  return NextResponse.json({
    conversation: { ...conversation, last_message_preview: preview },
    message,
  });
}
