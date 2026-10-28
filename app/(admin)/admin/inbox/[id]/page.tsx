import { notFound } from "next/navigation";

import { SupportInboxThread } from "@/components/admin/support-inbox";
import { AppPage } from "@/components/shared/app-page";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SupportConversationWithUser,
  SupportMessage,
} from "@/types/support";

export default async function AdminInboxThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const { data: conversation } = await admin
    .from("support_conversations")
    .select(
      "*,user:profiles!support_conversations_user_id_fkey(id,full_name,email)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!conversation) notFound();

  const { data: messages } = await admin
    .from("support_messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  if ((conversation.unread_admin ?? 0) > 0) {
    await admin
      .from("support_conversations")
      .update({ unread_admin: 0, updated_at: new Date().toISOString() })
      .eq("id", params.id);
  }

  const row = conversation as SupportConversationWithUser & {
    user:
      | SupportConversationWithUser["user"]
      | NonNullable<SupportConversationWithUser["user"]>[];
  };

  return (
    <AppPage
      description="Reply as Mundoria. Visitors see your message in the site messenger."
      eyebrow="Inbox"
      headerSize="compact"
      title="Conversation"
    >
      <SupportInboxThread
        conversationId={params.id}
        initialConversation={{
          ...row,
          unread_admin: 0,
          user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
        }}
        initialMessages={(messages ?? []) as SupportMessage[]}
      />
    </AppPage>
  );
}
