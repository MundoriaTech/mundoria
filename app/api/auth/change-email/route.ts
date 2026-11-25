import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createEmailChangeToken,
  EMAIL_CHANGE_TTL_MS,
  normalizeEmail,
} from "@/lib/auth/change-email";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

const bodySchema = z.object({
  newEmail: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your current password."),
});

export async function POST(request: Request) {
  const { supabase, user } = await getRequestUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const currentEmail = normalizeEmail(user.email);
  const newEmail = normalizeEmail(parsed.data.newEmail);
  if (newEmail === currentEmail) {
    return NextResponse.json(
      { error: "That is already your email address." },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Auth is not configured." },
      { status: 500 },
    );
  }

  const passwordCheck = createClient(url, anon, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { error: passwordError } = await passwordCheck.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (passwordError) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const admin = createAdminClient();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("email", newEmail)
    .neq("id", user.id)
    .limit(1);
  if (taken?.length) {
    return NextResponse.json(
      { error: "Another Mundoria account already uses that email." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  // Supabase's own mailer does not reach customers (and its redirect list
  // still points at the retired domain), so the confirmation link is ours,
  // sent through Resend like every other auth email.
  const { hash, token } = await createEmailChangeToken();
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      email_change_expires_at: new Date(Date.now() + EMAIL_CHANGE_TTL_MS).toISOString(),
      email_change_from: currentEmail,
      email_change_requested_at: new Date().toISOString(),
      email_change_to: newEmail,
      email_change_token_hash: hash,
    },
  });
  if (metadataError) {
    Sentry.captureException(metadataError);
    return NextResponse.json(
      { error: "Unable to start the email change. Please try again." },
      { status: 500 },
    );
  }

  const confirmUrl = new URL("/confirm-email-change", appUrl);
  confirmUrl.searchParams.set("uid", user.id);
  confirmUrl.searchParams.set("token", token);
  const sent = await sendBrandedEmail({
    data: {
      appUrl,
      confirmUrl: confirmUrl.toString(),
      firstName: profile?.full_name?.split(" ")[0],
      fullName: profile?.full_name,
      newEmail,
      previousEmail: currentEmail,
      status: "confirm",
    },
    template: "auth.email_changed",
    to: newEmail,
  }).catch((error) => {
    Sentry.captureException(error);
    return false;
  });
  if (!sent) {
    return NextResponse.json(
      { error: "We couldn't send the confirmation email. Check the address and try again." },
      { status: 502 },
    );
  }

  try {
    await sendBrandedEmail({
      data: {
        appUrl,
        firstName: profile?.full_name?.split(" ")[0],
        fullName: profile?.full_name,
        newEmail,
        previousEmail: currentEmail,
        status: "requested",
      },
      template: "auth.email_changed",
      to: currentEmail,
    });
  } catch (error) {
    Sentry.captureException(error);
  }

  return NextResponse.json({
    message:
      "Check the new inbox for a confirmation link. Your current email stays active until you confirm.",
    success: true,
  });
}
