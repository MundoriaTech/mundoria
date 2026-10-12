import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { pickDefaultAvatar } from "@/lib/avatars/default-pack";
import { signupSchema } from "@/lib/auth/schemas";
import { sendAccountWelcomeIfNeeded } from "@/lib/auth/welcome-email";
import { applyReferralAtSignup } from "@/lib/customer/referrals";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 },
    );
  }

  const { full_name, email, password, phone, role, referral_code } = parsed.data;
  const avatarUrl = role === "cleaner" ? pickDefaultAvatar(email).src : undefined;
  const supabase = createRouteHandlerClient({ cookies });
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const nextPath = role === "cleaner" ? "/cleaner/dashboard" : "/dashboard";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: {
        avatar_url: avatarUrl,
        full_name,
        phone,
        role,
      },
      emailRedirectTo: `${appUrl}/auth/callback?type=signup&next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      {
        code: taken ? "email_taken" : "signup_failed",
        error: taken
          ? "An account already exists for this email."
          : error.message,
      },
      { status: 400 },
    );
  }

  // Supabase may return a user with no identities when the email is already registered.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return NextResponse.json(
      {
        code: "email_taken",
        error: "An account already exists for this email.",
      },
      { status: 400 },
    );
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

  if (data.user && data.session) {
    try {
      welcomeEmailSent = await sendAccountWelcomeIfNeeded({
        appUrl,
        email,
        emailConfirmedAt: data.user.email_confirmed_at,
        fullName: full_name,
        metadata: data.user.user_metadata,
        profileExisted: true,
        role,
        userId: data.user.id,
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
