import * as Sentry from "@sentry/nextjs";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyEmailChangeCompleted({
  appUrl,
  user,
}: {
  appUrl: string;
  user: {
    email?: string | null;
    id: string;
    user_metadata?: Record<string, unknown> | null;
  };
}) {
  const previousEmail =
    typeof user.user_metadata?.email_change_from === "string"
      ? user.user_metadata.email_change_from
      : null;
  const pendingTo =
    typeof user.user_metadata?.email_change_to === "string"
      ? user.user_metadata.email_change_to
      : null;

  if (
    !user.email ||
    !previousEmail ||
    !pendingTo ||
    previousEmail.toLowerCase() === user.email.toLowerCase() ||
    pendingTo.toLowerCase() !== user.email.toLowerCase()
  ) {
    return { skipped: true as const };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.email !== user.email) {
    await admin
      .from("profiles")
      .update({ email: user.email })
      .eq("id", user.id);
  }

  try {
    await sendBrandedEmail({
      data: {
        appUrl,
        firstName: profile?.full_name?.split(" ")[0],
        fullName: profile?.full_name,
        newEmail: user.email,
        previousEmail,
        status: "completed",
      },
      template: "auth.email_changed",
      to: previousEmail,
    });
  } catch (error) {
    Sentry.captureException(error);
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      email_change_from: null,
      email_change_requested_at: null,
      email_change_to: null,
    },
  });

  return { skipped: false as const };
}
