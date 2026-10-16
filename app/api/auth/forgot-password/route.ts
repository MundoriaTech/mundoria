import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/lib/auth/schemas";
import {
  resolveAppUrl,
  sendAuthLinkEmail,
} from "@/lib/auth/send-auth-link-email";

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const appUrl = resolveAppUrl(request);
  // Prefer the update-password page directly so recovery works even when
  // Supabase falls back to hash tokens on the redirect target.
  const redirectTo = `${appUrl}/update-password`;

  try {
    await sendAuthLinkEmail({
      appUrl,
      email,
      redirectTo,
      type: "recovery",
    });
  } catch (error) {
    // Avoid account enumeration: users always see the same response.
    Sentry.captureException(error);
  }

  return NextResponse.json({ success: true });
}
