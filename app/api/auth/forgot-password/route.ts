import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const requestOrigin = new URL(request.url).origin;
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appUrl = requestOrigin.includes("localhost")
    ? requestOrigin
    : configuredAppUrl ?? requestOrigin;
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/update-password")}`;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      email,
      options: { redirectTo },
      type: "recovery",
    });

    if (error) throw error;

    const resetUrl = data.properties?.action_link;

    if (resetUrl) {
      await sendBrandedEmail({
        data: {
          appUrl,
          email,
          resetUrl,
          securityNote:
            "For your safety, never forward password reset emails. CleanScape will never ask for your password by email.",
        },
        template: "auth.password_reset",
        to: email,
      });
    }
  } catch (error) {
    // Avoid account enumeration: users always see the same response.
    Sentry.captureException(error);
  }

  return NextResponse.json({ success: true });
}
