import * as Sentry from "@sentry/nextjs";

import { sendBrandedEmail } from "@/lib/email/send-email";

/** Email ops when someone creates a customer or cleaner account. */
export async function notifyAdminUserSignedUp(input: {
  appUrl: string;
  email: string;
  fullName: string;
  role: "customer" | "cleaner";
  userId: string;
}) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY || !to) return;

  const isCleaner = input.role === "cleaner";
  const profileUrl = isCleaner
    ? `${input.appUrl}/admin/cleaners/${input.userId}`
    : `${input.appUrl}/admin/customer/${input.userId}`;

  try {
    await sendBrandedEmail({
      data: {
        appUrl: input.appUrl,
        profileUrl,
        role: input.role,
        userEmail: input.email,
        userName: input.fullName,
      },
      template: "admin.user_signed_up",
      to,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}
