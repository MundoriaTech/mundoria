import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

import { trackUserActivity } from "@/lib/analytics/user-activity";
import { completeProfileSchema } from "@/lib/auth/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileToZoho } from "@/lib/zoho/crm";

export async function POST(request: Request) {
  const { user } = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const parsed = completeProfileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile details." },
      { status: 400 },
    );
  }

  const { full_name, phone } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name,
      phone,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: saved } = await admin
    .from("profiles")
    .select("email,role")
    .eq("id", user.id)
    .maybeSingle();
  const email = saved?.email ?? user.email;
  if (email && saved?.role) {
    await syncProfileToZoho({ email, fullName: full_name, phone, role: saved.role, userId: user.id });
  }

  await trackUserActivity({
    eventName: "profile_completed",
    path: "/complete-profile",
    userId: user.id,
  });

  return NextResponse.json({ success: true });
}
