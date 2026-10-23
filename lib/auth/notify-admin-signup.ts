import * as Sentry from "@sentry/nextjs";

import {
  resolveAdminNotificationEmail,
  sendBrandedEmail,
} from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

/** Email ops + portal admins when someone creates a customer or cleaner account. */
export async function notifyAdminUserSignedUp(input: {
  appUrl: string;
  email: string;
  fullName: string;
  role: "customer" | "cleaner";
  userId: string;
}) {
  const isCleaner = input.role === "cleaner";
  const roleLabel = isCleaner ? "cleaner" : "customer";
  const profileUrl = isCleaner
    ? `${input.appUrl}/admin/cleaners/${input.userId}`
    : `${input.appUrl}/admin/customer/${input.userId}`;
  const title = `New ${roleLabel} signup`;
  const body = `${input.fullName || "Someone"} just signed up as a ${roleLabel} on Mundoria.`;
  const emailData = {
    appUrl: input.appUrl,
    profileUrl,
    role: input.role,
    userEmail: input.email,
    userName: input.fullName,
  };

  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id,email,notification_preferences")
    .eq("role", "admin");

  if (admins?.length) {
    try {
      await admin.from("notifications").insert(
        admins.map((recipient) => ({
          body,
          data: {
            profile_url: profileUrl,
            role: input.role,
            user_id: input.userId,
          },
          title,
          type: "user_signed_up",
          user_id: recipient.id,
        })),
      );
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  if (!process.env.RESEND_API_KEY) return;

  const opsInbox = resolveAdminNotificationEmail().toLowerCase();
  const recipients = new Set<string>([opsInbox]);

  for (const recipient of admins ?? []) {
    const prefs = recipient.notification_preferences as
      | { email?: boolean }
      | undefined;
    if (prefs?.email === false) continue;
    const address = recipient.email?.trim().toLowerCase();
    if (address) recipients.add(address);
  }

  try {
    await Promise.all(
      Array.from(recipients).map((to) =>
        sendBrandedEmail({
          data: emailData,
          template: "admin.user_signed_up",
          to,
        }),
      ),
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}
