import { resolveAdminNotificationEmail } from "@/lib/email/send-email";
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

  const sent = new Set<string>();
  await Promise.all(
    (admins ?? []).flatMap((recipient) => {
      const address = recipient.email?.trim().toLowerCase();
      if (address) sent.add(address);
      return [
        sendPushNotification(recipient.id, title, body, data),
        sendEmail(recipient.email, title, type, data),
      ];
    }),
  );

  const ops = resolveAdminNotificationEmail().toLowerCase();
  if (!sent.has(ops)) {
    await sendEmail(ops, title, type, data);
  }
}
