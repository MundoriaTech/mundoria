import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";
import { syncProfileToZoho } from "@/lib/zoho/crm";

/**
 * Called after the account settings form saves. Reads the saved profile
 * server-side (the body is ignored) and pushes name and phone to Zoho.
 */
export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("email,full_name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.email && profile.role) {
    await syncProfileToZoho({
      email: profile.email,
      fullName: profile.full_name ?? "",
      phone: profile.phone,
      role: profile.role,
      userId: user.id,
    });
  }

  return NextResponse.json({ ok: true });
}
