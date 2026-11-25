import { adminIdsWithAccess, type AdminArea } from "@/lib/admin/access";
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
  options: { area?: AdminArea } = {},
) {
  const admin = createAdminClient();
  const { data: allAdmins } = await admin
    .from("profiles")
    .select("id,email")
    .eq("role", "admin");
  // Alerts about a restricted section only go to admins who can see it.
  const allowed = options.area ? new Set(await adminIdsWithAccess(options.area)) : null;
  const admins = (allAdmins ?? []).filter((row) => !allowed || allowed.has(row.id as string));

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
  // The shared ops inbox doesn't get alerts for grant-only sections.
  if (!sent.has(ops) && options.area !== "meta_leads") {
    await sendBrandedEmail({
      data: briefing,
      subject: briefing.subject,
      template: "admin.alert",
      to: ops,
    });
  }
}
