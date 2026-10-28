import { SupportInboxList } from "@/components/admin/support-inbox";
import { AppPage } from "@/components/shared/app-page";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportConversationWithUser } from "@/types/support";

export default async function AdminInboxPage() {
  const { data, error } = await createAdminClient()
    .from("support_conversations")
    .select(
      "id,user_id,guest_token,guest_name,guest_email,status,subject,last_message_at,last_message_preview,unread_admin,unread_user,created_at,updated_at,user:profiles!support_conversations_user_id_fkey(id,full_name,email)",
    )
    .eq("status", "open")
    .order("last_message_at", { ascending: false })
    .limit(100);

  const conversations = ((data ?? []) as Array<
    SupportConversationWithUser & {
      user:
        | SupportConversationWithUser["user"]
        | NonNullable<SupportConversationWithUser["user"]>[];
    }
  >).map((row) => ({
    ...row,
    user: Array.isArray(row.user) ? row.user[0] ?? null : row.user,
  }));

  return (
    <AppPage
      description="Replies from the site messenger land here. Home, Messages and Help tabs on the widget feed this inbox."
      eyebrow="Operations"
      title="Inbox"
    >
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Inbox could not be loaded yet. Apply the latest database migration
          (`support_conversations`) and refresh.
        </p>
      ) : (
        <SupportInboxList initial={conversations} />
      )}
    </AppPage>
  );
}
