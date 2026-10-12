import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendAccountWelcomeIfNeeded } from "@/lib/auth/welcome-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUserRole } from "@/types/auth";

/** Sends the welcome email after an email confirmation that landed in the URL hash. */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !user.email_confirmed_at) {
    return NextResponse.json({ sent: false });
  }

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isUserRole(profile.role)) {
    return NextResponse.json({ sent: false });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const sent = await sendAccountWelcomeIfNeeded({
    appUrl,
    email: profile.email ?? user.email,
    emailConfirmedAt: user.email_confirmed_at,
    fullName: profile.full_name,
    metadata: user.user_metadata,
    profileExisted: true,
    role: profile.role,
    userId: user.id,
  });

  return NextResponse.json({ sent });
}
