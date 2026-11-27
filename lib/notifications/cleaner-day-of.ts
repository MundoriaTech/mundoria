import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendPushNotification, sendSMS } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Messages a cleaner must see on the day of a visit (still coming?, please
 * check in, don't forget to check out). Push alone isn't enough: many cleaners
 * have no push set up, so the message also goes by email and text, each only
 * where the cleaner's notification settings allow it. Never throws.
 */
export async function notifyCleanerDayOf(input: {
  bookingId: string;
  /** Shown as the email button; defaults to opening the job. */
  actionLabel?: string;
  body: string;
  cleanerId: string;
  title: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const jobUrl = `${appUrl}/cleaner/job/${input.bookingId}`;
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("email,phone,full_name,notification_preferences")
    .eq("id", input.cleanerId)
    .maybeSingle()
    .then(
      (result) => result,
      () => ({ data: null }),
    );
  const prefs = (profile?.notification_preferences ?? {}) as {
    email?: boolean;
    sms?: boolean;
  };
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  await Promise.all([
    sendPushNotification(input.cleanerId, input.title, input.body, {
      booking_id: input.bookingId,
    }).catch(() => undefined),
    profile?.email && prefs.email !== false
      ? sendBrandedEmail({
          data: {
            actionLabel: input.actionLabel ?? "Open the job",
            actionUrl: jobUrl,
            body: `${firstName ? `Hi ${firstName}, ` : ""}${input.body}`,
            preview: input.body,
            subject: `Mundoria: ${input.title}`,
            title: input.title,
          },
          template: "system.generic",
          to: profile.email,
        }).catch(() => undefined)
      : null,
    profile?.phone && prefs.sms !== false
      ? sendSMS(profile.phone, `Mundoria: ${input.title}. ${input.body} ${jobUrl}`).catch(
          () => undefined,
        )
      : null,
  ]);
}
