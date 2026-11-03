import * as Sentry from "@sentry/nextjs";

import {
  CLEANER_SIGNUP_EMAIL_SEND_LIMIT,
  CLEANER_SIGNUP_IP_SEND_LIMIT,
  CLEANER_SIGNUP_OTP_MAX_ATTEMPTS,
  CLEANER_SIGNUP_OTP_TTL_MS,
  CLEANER_SIGNUP_RESEND_COOLDOWN_MS,
  type CleanerSignupPayload,
  clientIpFromRequest,
  decryptSignupPayload,
  encryptSignupPayload,
  generateSignupOtp,
  hashSignupIp,
  hashSignupOtp,
  normalizeSignupEmail,
} from "@/lib/auth/cleaner-signup-otp";
import { pickDefaultAvatar } from "@/lib/avatars/default-pack";
import { trackUserActivity } from "@/lib/analytics/user-activity";
import { notifyAdminUserSignedUp } from "@/lib/auth/notify-admin-signup";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSignupToZoho } from "@/lib/zoho/crm";

type ChallengeRow = {
  attempts: number;
  code_hash: string;
  created_at: string;
  email: string;
  email_normalized: string;
  expires_at: string;
  id: string;
  ip_hash: string;
  last_sent_at: string;
  payload_ciphertext: string;
  payload_iv: string;
  payload_tag: string;
  send_count: number;
};

export async function startCleanerEmailSignupOtp(input: {
  appUrl: string;
  payload: CleanerSignupPayload;
  request: Request;
  resend?: boolean;
}) {
  const admin = createAdminClient();
  const email = normalizeSignupEmail(input.payload.email);
  const ip = clientIpFromRequest(input.request);
  const ipHash = hashSignupIp(ip);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: ipCount, error: ipCountError } = await admin
    .from("email_signup_challenges")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if (ipCountError) throw ipCountError;
  if ((ipCount ?? 0) >= CLEANER_SIGNUP_IP_SEND_LIMIT) {
    return {
      error: "Too many signup attempts from this network. Try again later.",
      status: 429 as const,
    };
  }

  const { data: existingList, error: existingError } = await admin
    .from("email_signup_challenges")
    .select("*")
    .eq("email_normalized", email)
    .limit(1);
  if (existingError) throw existingError;
  const existing = (existingList?.[0] ?? null) as ChallengeRow | null;

  if (existing) {
    const sentRecently =
      Date.now() - new Date(existing.last_sent_at).getTime() <
      CLEANER_SIGNUP_RESEND_COOLDOWN_MS;
    if (sentRecently && input.resend) {
      return {
        email,
        error: null,
        message: "Please wait a minute before requesting a new code.",
        status: 200 as const,
      };
    }

    const sendsInHour =
      new Date(existing.created_at).getTime() >= Date.parse(hourAgo)
        ? existing.send_count
        : 0;
    if (sendsInHour >= CLEANER_SIGNUP_EMAIL_SEND_LIMIT) {
      return {
        error: "Too many codes sent to this email. Try again later.",
        status: 429 as const,
      };
    }
  }

  const { data: alreadyUser } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (alreadyUser) {
    return {
      error: "An account already exists for this email.",
      status: 400 as const,
    };
  }

  const code = generateSignupOtp();
  const codeHash = hashSignupOtp(code, email);
  const encrypted = encryptSignupPayload({ ...input.payload, email });
  const expiresAt = new Date(Date.now() + CLEANER_SIGNUP_OTP_TTL_MS).toISOString();
  const now = new Date().toISOString();

  const row = {
    attempts: 0,
    code_hash: codeHash,
    email,
    email_normalized: email,
    expires_at: expiresAt,
    ip_hash: ipHash,
    last_sent_at: now,
    payload_ciphertext: encrypted.ciphertext,
    payload_iv: encrypted.iv,
    payload_tag: encrypted.tag,
    send_count: existing
      ? new Date(existing.created_at).getTime() >= Date.parse(hourAgo)
        ? existing.send_count + 1
        : 1
      : 1,
  };

  const { error: upsertError } = await admin
    .from("email_signup_challenges")
    .upsert(row, { onConflict: "email_normalized" });
  if (upsertError) throw upsertError;

  const firstName = input.payload.full_name.trim().split(/\s+/)[0] || undefined;
  const sent = await sendBrandedEmail({
    data: {
      appUrl: input.appUrl,
      firstName,
      otpCode: code,
    },
    template: "auth.signup_otp",
    to: email,
  });

  if (!sent) {
    const allowDevHint = process.env.NODE_ENV !== "production";
    if (!allowDevHint) {
      return {
        error: "We could not send the verification email. Try again shortly.",
        status: 503 as const,
      };
    }
    return {
      devCode: code,
      email,
      error: null,
      message: input.resend
        ? "We sent a new code."
        : "Check your email for the code we already sent.",
      requiresEmailOtp: true as const,
      status: 200 as const,
    };
  }

  return {
    email,
    error: null,
    message: input.resend
      ? "We sent a new code."
      : "Check your email for the code we already sent.",
    requiresEmailOtp: true as const,
    status: 200 as const,
  };
}

export async function verifyCleanerEmailSignupOtp(input: {
  appUrl: string;
  code: string;
  email: string;
  request: Request;
}) {
  const admin = createAdminClient();
  const email = normalizeSignupEmail(input.email);
  const code = input.code.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit code from your email.", status: 400 as const };
  }

  const { data: rows, error } = await admin
    .from("email_signup_challenges")
    .select("*")
    .eq("email_normalized", email)
    .limit(1);
  if (error) throw error;
  const challenge = (rows?.[0] ?? null) as ChallengeRow | null;
  if (!challenge) {
    return {
      error: "No pending signup found for this email. Start again.",
      status: 400 as const,
    };
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await admin.from("email_signup_challenges").delete().eq("id", challenge.id);
    return {
      error: "That code has expired. Request a new one.",
      status: 400 as const,
    };
  }

  if (challenge.attempts >= CLEANER_SIGNUP_OTP_MAX_ATTEMPTS) {
    await admin.from("email_signup_challenges").delete().eq("id", challenge.id);
    return {
      error: "Too many incorrect attempts. Start signup again.",
      status: 429 as const,
    };
  }

  const expected = hashSignupOtp(code, email);
  if (expected !== challenge.code_hash) {
    await admin
      .from("email_signup_challenges")
      .update({ attempts: challenge.attempts + 1 })
      .eq("id", challenge.id);
    return { error: "That code is incorrect.", status: 400 as const };
  }

  let payload: CleanerSignupPayload;
  try {
    payload = decryptSignupPayload({
      ciphertext: challenge.payload_ciphertext,
      iv: challenge.payload_iv,
      tag: challenge.payload_tag,
    });
  } catch (decryptError) {
    Sentry.captureException(decryptError);
    return {
      error: "Unable to finish signup. Please start again.",
      status: 500 as const,
    };
  }

  const avatarUrl = pickDefaultAvatar(email).src;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: payload.password,
    user_metadata: {
      avatar_url: avatarUrl,
      full_name: payload.full_name,
      marketing_opt_in: Boolean(payload.marketing_opt_in),
      phone: payload.phone.trim(),
      role: "cleaner",
    },
  });

  if (createError) {
    const taken = /already|registered|exists/i.test(createError.message);
    return {
      error: taken
        ? "An account already exists for this email."
        : createError.message,
      status: 400 as const,
    };
  }

  const user = created.user;
  if (!user) {
    return { error: "Unable to create your account.", status: 400 as const };
  }

  await admin.from("email_signup_challenges").delete().eq("id", challenge.id);

  await trackUserActivity({
    eventName: "signed_up",
    metadata: { bookingCheckout: false, role: "cleaner", via: "email_otp" },
    path: "/signup/cleaner",
    userId: user.id,
  });

  await notifyAdminUserSignedUp({
    appUrl: input.appUrl,
    email,
    fullName: payload.full_name,
    role: "cleaner",
    userId: user.id,
  });

  try {
    await syncSignupToZoho({
      email,
      fullName: payload.full_name,
      phone: payload.phone,
      role: "cleaner",
      userId: user.id,
    });
  } catch (zohoError) {
    Sentry.captureException(zohoError);
  }

  return {
    email,
    error: null,
    hasSession: false,
    nextPath: payload.nextPath,
    requiresEmailConfirmation: false,
    role: "cleaner" as const,
    status: 200 as const,
  };
}
