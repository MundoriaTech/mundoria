import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { signupSchema } from "@/lib/auth/schemas";
import { applyReferralAtSignup } from "@/lib/customer/referrals";
import { sendBrandedEmail } from "@/lib/email/send-email";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 },
    );
  }

  const { full_name, email, password, phone, role, referral_code } = parsed.data;
  const supabase = createRouteHandlerClient({ cookies });
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const nextPath = role === "cleaner" ? "/cleaner/dashboard" : "/dashboard";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
        role,
      },
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let welcomeEmailSent = false;
  let referralPromoCode: string | null = null;

  if (
    role === "customer" &&
    data.user?.id &&
    referral_code?.trim()
  ) {
    try {
      const referral = await applyReferralAtSignup({
        appUrl,
        refereeId: data.user.id,
        referralCode: referral_code,
      });
      referralPromoCode = referral?.promoCode ?? null;
    } catch (referralError) {
      Sentry.captureException(referralError);
      return NextResponse.json(
        {
          error:
            referralError instanceof Error
              ? referralError.message
              : "Invalid referral code",
        },
        { status: 400 },
      );
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      welcomeEmailSent = await sendBrandedEmail({
        data: {
          actionUrl: `${appUrl}${nextPath}`,
          appUrl,
          email,
          firstName: full_name.split(" ")[0],
          fullName: full_name,
          role,
        },
        template: role === "cleaner" ? "cleaner.welcome" : "customer.welcome",
        to: email,
      });
    } catch (emailError) {
      Sentry.captureException(emailError);
    }
  }

  return NextResponse.json({
    role,
    hasSession: Boolean(data.session),
    referralPromoCode,
    requiresEmailConfirmation: Boolean(data.user && !data.session),
    welcomeEmailSent,
  });
}
