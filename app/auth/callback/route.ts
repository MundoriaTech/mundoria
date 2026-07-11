import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { dashboardForRole, safeRedirectPath } from "@/lib/auth/redirects";
import { isUserRole } from "@/types/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
        : { data: null };
      const fallback = isUserRole(profile?.role)
        ? dashboardForRole(profile.role)
        : "/";

      return NextResponse.redirect(
        new URL(safeRedirectPath(requestedNext, fallback), requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Unable%20to%20complete%20sign-in", requestUrl.origin),
  );
}
