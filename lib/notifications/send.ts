import { Resend } from "resend";
import twilio from "twilio";

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
  if (!process.env.RESEND_API_KEY) return false;
  const rows = Object.entries(data)
    .map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</p>`)
    .join("");
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ??
      "CleanScape <notifications@resend.dev>",
    html: `<h1>${escapeHtml(subject)}</h1><p>Template: ${escapeHtml(templateName)}</p>${rows}`,
    subject,
    to,
  });
  return !error;
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

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}
