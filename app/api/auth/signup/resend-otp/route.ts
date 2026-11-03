import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { startCleanerEmailSignupOtp } from "@/lib/auth/cleaner-signup-flow";
import {
  decryptSignupPayload,
  normalizeSignupEmail,
} from "@/lib/auth/cleaner-signup-otp";
import { resolveAppUrl } from "@/lib/auth/send-auth-link-email";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the email you used to sign up." },
      { status: 400 },
    );
  }

  const email = normalizeSignupEmail(parsed.data.email);
  const admin = createAdminClient();

  try {
    const { data: rows, error } = await admin
      .from("email_signup_challenges")
      .select("*")
      .eq("email_normalized", email)
      .limit(1);
    if (error) throw error;
    const challenge = rows?.[0];
    if (!challenge) {
      return NextResponse.json(
        { error: "No pending signup found. Start again from the form." },
        { status: 400 },
      );
    }

    const payload = decryptSignupPayload({
      ciphertext: challenge.payload_ciphertext,
      iv: challenge.payload_iv,
      tag: challenge.payload_tag,
    });

    const otp = await startCleanerEmailSignupOtp({
      appUrl: resolveAppUrl(request),
      payload,
      request,
      resend: true,
    });

    if (otp.error) {
      return NextResponse.json({ error: otp.error }, { status: otp.status });
    }

    return NextResponse.json({
      devCode: "devCode" in otp ? otp.devCode : undefined,
      email: otp.email,
      message: otp.message,
      success: true,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Unable to resend the code. Try again shortly." },
      { status: 500 },
    );
  }
}