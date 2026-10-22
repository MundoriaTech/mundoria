import { dashboardForRole } from "@/lib/auth/redirects";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";

const JUST_CONFIRMED_MS = 15 * 60 * 1000;

export function emailConfirmedJustNow(emailConfirmedAt: string | null | undefined) {
  if (!emailConfirmedAt) return false;
  const confirmed = new Date(emailConfirmedAt).getTime();
  return Number.isFinite(confirmed) && Date.now() - confirmed < JUST_CONFIRMED_MS;
}

/**
 * Sends the account welcome email once the address is confirmed.
 * A brand-new Google sign-in has no separate confirmation email, so that
 * welcome goes out on the first callback. Email sign-up waits until the
 * confirmation link is opened.
 */
export async function sendAccountWelcomeIfNeeded({
  actionLabel,
  actionUrl,
  appUrl,
  email,
  emailConfirmedAt,
  fullName,
  metadata,
  profileExisted,
  role,
  userId,
}: {
  actionLabel?: string;
  actionUrl?: string;
  appUrl: string;
  email: string;
  emailConfirmedAt?: string | null;
  fullName: string;
  metadata?: Record<string, unknown>;
  profileExisted: boolean;
  role: UserRole;
  userId: string;
}) {
  if (role !== "customer" && role !== "cleaner") return false;
  if (metadata?.welcome_email_sent === true) return false;
  if (profileExisted && !emailConfirmedJustNow(emailConfirmedAt)) return false;
  if (!process.env.RESEND_API_KEY || !email) return false;

  const sent = await sendBrandedEmail({
    data: {
      actionLabel:
        actionLabel ??
        (role === "cleaner" ? "Continue cleaner onboarding" : "Open your account"),
      actionUrl: actionUrl || `${appUrl}${dashboardForRole(role)}`,
      appUrl,
      email,
      firstName: fullName.split(" ")[0],
      fullName,
      role,
    },
    template: role === "cleaner" ? "cleaner.welcome" : "customer.welcome",
    to: email,
  });
  if (!sent) return false;

  try {
    await createAdminClient().auth.admin.updateUserById(userId, {
      user_metadata: {
        ...metadata,
        welcome_email_sent: true,
      },
    });
  } catch {
    // The email already went out. A later visit can skip it once the flag sticks.
  }

  return true;
}
