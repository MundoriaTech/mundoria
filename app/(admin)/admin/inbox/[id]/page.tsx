import { notFound } from "next/navigation";

import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { SupportInboxThread } from "@/components/admin/support-inbox";
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
    <div className="min-w-0">
      <AdminPageIntro>
        Reply as Mundoria. Visitors see your message in the site messenger.
      </AdminPageIntro>
      <SupportInboxThread
        conversationId={params.id}
        initialConversation={{
          ...row,
          unread_admin: 0,
          user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
        }}
        initialMessages={(messages ?? []) as SupportMessage[]}
      />
    </div>
  );
}
