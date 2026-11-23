import { composeAdminAlertEmail } from "@/lib/email/admin-alert";
import {
  resolveAdminNotificationEmail,
  sendBrandedEmail,
} from "@/lib/email/send-email";
import { sendPushNotification } from "@/lib/notifications/send";
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

  const briefing = composeAdminAlertEmail(type, title, body, data);

  const sent = new Set<string>();
  await Promise.all(
    (admins ?? []).flatMap((recipient) => {
      const address = recipient.email?.trim().toLowerCase();
      if (address) sent.add(address);
      return [
        sendPushNotification(recipient.id, briefing.title, body, data),
        address
          ? sendBrandedEmail({
              data: briefing,
              subject: briefing.subject,
              template: "admin.alert",
              to: address,
            })
          : Promise.resolve(false),
      ];
    }),
  );

  const ops = resolveAdminNotificationEmail().toLowerCase();
  if (!sent.has(ops)) {
    await sendBrandedEmail({
      data: briefing,
      subject: briefing.subject,
      template: "admin.alert",
      to: ops,
    });
  }
}
