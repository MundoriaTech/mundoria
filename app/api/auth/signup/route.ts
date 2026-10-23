import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { pickDefaultAvatar } from "@/lib/avatars/default-pack";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { signupSchema } from "@/lib/auth/schemas";
import {
  resolveAppUrl,
  sendAuthLinkEmail,
} from "@/lib/auth/send-auth-link-email";
import { trackUserActivity } from "@/lib/analytics/user-activity";
import { notifyAdminUserSignedUp } from "@/lib/auth/notify-admin-signup";
import { applyReferralAtSignup } from "@/lib/customer/referrals";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 },
    );
  }

  const {
    full_name,
    password,
    phone,
    role,
    referral_code,
    marketing_opt_in,
  } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const avatarUrl = role === "cleaner" ? pickDefaultAvatar(email).src : undefined;
  const admin = createAdminClient();
  const appUrl = resolveAppUrl(request);
  const defaultNext = role === "cleaner" ? "/cleaner/dashboard" : "/dashboard";
  const requestedNext =
    typeof body.next === "string" ? body.next : null;
  const nextPath = safeRedirectPath(requestedNext, defaultNext);
  const bookingCheckoutSignup =
    role === "customer" && nextPath.startsWith("/booking");
  /**
   * Customers (booking + standalone): Wecasa-style soft confirm — sign-in ready
   * immediately; confirm mail stays out-of-band. Cleaners still hard-confirm.
   */
  const softEmailConfirm = role === "customer";
  /** Confirm-link landing stays out of the booking funnel. */
  const confirmNextPath = bookingCheckoutSignup ? "/dashboard" : nextPath;
  const emailRedirectTo = `${appUrl}/auth/callback?type=signup&next=${encodeURIComponent(confirmNextPath)}`;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: softEmailConfirm,
    password,
    user_metadata: {
      avatar_url: avatarUrl,
      full_name,
      marketing_opt_in: Boolean(marketing_opt_in),
      phone: phone.trim(),
      role,
      ...(softEmailConfirm ? { send_welcome_on_email_link: true } : {}),
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

  const user = created.user;
  if (!user) {
    return NextResponse.json(
      { code: "signup_failed", error: "Unable to create your account." },
      { status: 400 },
    );
  }

  let referralPromoCode: string | null = null;

  if (role === "customer" && referral_code?.trim()) {
    try {
      const referral = await applyReferralAtSignup({
        appUrl,
        refereeId: user.id,
        referralCode: referral_code,
      });
      referralPromoCode = referral?.promoCode ?? null;
    } catch (referralError) {
      Sentry.captureException(referralError);
      // Roll back the auth user if referral code is invalid so signup can retry cleanly.
      try {
        await admin.auth.admin.deleteUser(user.id);
      } catch (deleteError) {
        Sentry.captureException(deleteError);
      }
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

  try {
    await sendAuthLinkEmail({
      appUrl,
      email,
      firstName: full_name.split(/\s+/)[0],
      password,
      redirectTo: emailRedirectTo,
      // Soft-confirm accounts are already sign-in ready — magic link still lands on “validated”.
      type: softEmailConfirm ? "magiclink" : "signup",
    });
  } catch (emailError) {
    Sentry.captureException(emailError);
    if (!softEmailConfirm) {
      return NextResponse.json(
        {
          code: "signup_email_failed",
          error:
            "Your account was created, but we could not send the confirmation email. Try again in a moment, or use Forgot password after confirming with support.",
        },
        { status: 500 },
      );
    }
    // Soft confirm: account is usable even if the confirm mail fails.
  }

  await trackUserActivity({
    eventName: "signed_up",
    metadata: { bookingCheckout: bookingCheckoutSignup, role },
    path: bookingCheckoutSignup
      ? "/booking/new"
      : role === "cleaner"
        ? "/signup/cleaner"
        : "/signup",
    userId: user.id,
  });

  await notifyAdminUserSignedUp({
    appUrl,
    email,
    fullName: full_name,
    role,
    userId: user.id,
  });

  return NextResponse.json({
    email,
    hasSession: false,
    referralPromoCode,
    requiresEmailConfirmation: !softEmailConfirm,
    role,
    welcomeEmailSent: false,
  });
}
