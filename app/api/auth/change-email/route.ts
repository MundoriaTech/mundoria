import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  emailChangeRedirectPath,
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

  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const nextPath = emailChangeRedirectPath(profile?.role);
  const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      email_change_from: currentEmail,
      email_change_requested_at: new Date().toISOString(),
      email_change_to: newEmail,
    },
  });

  const { error: updateError } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo },
  );

  if (updateError) {
    Sentry.captureException(updateError);
    return NextResponse.json(
      { error: updateError.message || "Unable to start the email change." },
      { status: 400 },
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
