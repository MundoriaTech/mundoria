import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendBrandedEmail } from "@/lib/email/send-email";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await sendBrandedEmail({
      data: {
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
        email: user.email,
        firstName: profile?.full_name?.split(" ")[0],
        fullName: profile?.full_name,
        securityNote:
          "If you did not change this password, contact CleanScape support immediately and do not use links from unexpected emails.",
      },
      template: "auth.password_changed",
      to: user.email,
    });
  } catch (error) {
    Sentry.captureException(error);
  }

  return NextResponse.json({ success: true });
}
