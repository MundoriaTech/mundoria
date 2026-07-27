import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { isUserRole } from "@/types/auth";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  if (!hasSupabasePublicConfig()) {
    return { response, role: null, user: null };
  }
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("phone,role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const role = isUserRole(profile?.role) ? profile.role : null;
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";

  return { phone, response, role, user };
}
