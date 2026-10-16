import { createAdminClient } from "@/lib/supabase/admin";

/** Alert admins when a visitor sends a support message. */
export async function notifyAdminsOfSupportMessage({
  conversationId,
  preview,
}: {
  conversationId: string;
  preview: string;
}) {
  const admin = createAdminClient();
  const title = "New support message";
  const body = preview.slice(0, 180);
  const data = { conversation_id: conversationId, entity_id: conversationId };

  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((row) => ({
        body,
        data,
        title,
        type: "support_message",
        user_id: row.id,
      })),
    );
  }

  await admin.from("admin_alert_queue").insert({
    body,
    data,
    title,
    type: "support_message",
  });
}
