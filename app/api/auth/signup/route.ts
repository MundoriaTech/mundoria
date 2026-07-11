import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { signupSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 },
    );
  }

  const { full_name, email, password, phone, role } = parsed.data;
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

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailError } = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ??
          "CleanScape <onboarding@resend.dev>",
        to: email,
        subject: `Welcome to CleanScape, ${full_name.split(" ")[0]}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17352d">
            <h1>Welcome to CleanScape</h1>
            <p>Hi ${escapeHtml(full_name)},</p>
            <p>Your ${role} account is ready. We’re delighted to have you here.</p>
            <p><a href="${appUrl}${nextPath}">Open your dashboard</a></p>
          </div>
        `,
      });

      if (emailError) {
        throw new Error(emailError.message);
      }

      welcomeEmailSent = true;
    } catch (emailError) {
      Sentry.captureException(emailError);
    }
  }

  return NextResponse.json({
    role,
    hasSession: Boolean(data.session),
    requiresEmailConfirmation: Boolean(data.user && !data.session),
    welcomeEmailSent,
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}
