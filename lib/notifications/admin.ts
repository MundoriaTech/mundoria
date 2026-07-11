import {
  sendEmail,
  sendPushNotification,
} from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

export async function alertAdmins(
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id,email")
    .eq("role", "admin");

  await Promise.all(
    (admins ?? []).flatMap((recipient) => [
      sendPushNotification(recipient.id, title, body, data),
      sendEmail(recipient.email, title, type, data),
    ]),
  );
}
