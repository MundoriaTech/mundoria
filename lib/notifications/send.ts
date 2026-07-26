import twilio from "twilio";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendOneSignalNotification({
  body,
  data,
  playerId,
  title,
}: {
  body: string;
  data?: Record<string, unknown>;
  playerId: string | null;
  title: string;
}) {
  if (
    !playerId ||
    !process.env.ONESIGNAL_APP_ID ||
    !process.env.ONESIGNAL_REST_API_KEY
  ) {
    return false;
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: { en: body },
      data,
      headings: { en: title },
      include_player_ids: [playerId],
    }),
    headers: {
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return response.ok;
}

export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  return createAdminClient().from("notifications").insert({
    body,
    data,
    title,
    type,
    user_id: userId,
  });
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("onesignal_player_id,notification_preferences")
    .eq("id", userId)
    .single();
  const preferences = profile?.notification_preferences as
    | { push?: boolean }
    | undefined;

  await createInAppNotification(userId, "push", title, body, data);
  if (preferences?.push === false) return false;
  return sendOneSignalNotification({
    body,
    data,
    playerId: profile?.onesignal_player_id ?? null,
    title,
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, unknown> = {},
) {
  return sendBrandedEmail({
    data: {
      ...data,
      subject,
      templateName,
      title: subject,
      type: templateName,
    },
    subject,
    template: "system.generic",
    to,
  });
}

export async function sendSMS(phoneNumber: string, message: string) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    return false;
  }
  await twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  ).messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
  return true;
}
