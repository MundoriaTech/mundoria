import { NextResponse } from "next/server";

import { toE164 } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";
import { syncProfileToZoho } from "@/lib/zoho/crm";
import { syncCleanerToZoho } from "@/lib/zoho/sync-jobs";

/**
 * Called after the account settings form saves. Reads the saved profile
 * server-side (the body is ignored) and pushes name and phone to Zoho and to
 * the person's lead row, so the admin Leads page shows the number they use.
 * For cleaners it also refreshes the Recruit candidate (bio, areas, hours).
 */
export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email,full_name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  const phone = toE164(profile?.phone ?? "");
  if (phone) {
    await admin
      .from("leads")
      .update({ phone, updated_at: new Date().toISOString() })
      .eq("profile_id", user.id);
  }

  if (profile?.email && profile.role) {
    await syncProfileToZoho({
      email: profile.email,
      fullName: profile.full_name ?? "",
      phone: profile.phone,
      role: profile.role,
      userId: user.id,
    });
  }
  // A cleaner's bio, areas, services and hours live on the Recruit candidate.
  if (profile?.role === "cleaner") await syncCleanerToZoho(user.id);

  return NextResponse.json({ ok: true });
}
