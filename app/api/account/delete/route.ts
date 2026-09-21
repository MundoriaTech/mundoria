import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  confirmation: z.literal("DELETE"),
});

const ACTIVE_STATUSES = [
  "pending_match",
  "matched",
  "confirmed",
  "cleaner_en_route",
  "in_progress",
] as const;

export async function POST(request: Request) {
  const sessionClient = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Type DELETE to confirm account deletion.' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (profile.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted here. Contact support." },
      { status: 403 },
    );
  }

  if (profile.role === "customer") {
    const { data: active } = await admin
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .in("status", [...ACTIVE_STATUSES])
      .limit(1);
    if (active?.length) {
      return NextResponse.json(
        {
          error:
            "You still have upcoming or active sessions. Cancel them first, then delete your account.",
        },
        { status: 409 },
      );
    }
  }

  if (profile.role === "cleaner") {
    const { data: activeJobs } = await admin
      .from("bookings")
      .select("id")
      .eq("cleaner_id", user.id)
      .in("status", [...ACTIVE_STATUSES])
      .limit(1);
    if (activeJobs?.length) {
      return NextResponse.json(
        {
          error:
            "You still have assigned active jobs. Finish or hand them over before deleting your account.",
        },
        { status: 409 },
      );
    }
  }

  const tombstoneEmail = `deleted-${user.id.replace(/-/g, "")}@deleted.mundoria.local`;
  const now = new Date().toISOString();

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      avatar_url: null,
      email: tombstoneEmail,
      full_name: "Deleted account",
      onesignal_player_id: null,
      phone: null,
      updated_at: now,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (profile.role === "customer") {
    await admin
      .from("addresses")
      .update({
        address_line_1: "Removed",
        address_line_2: null,
        city: "Removed",
        label: null,
        latitude: null,
        longitude: null,
        postcode: "REMOVED",
        special_requirements: null,
      })
      .eq("customer_id", user.id);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    ban_duration: "876000h",
    email: tombstoneEmail,
    email_confirm: true,
    user_metadata: {
      deleted: true,
      deleted_at: now,
      former_email: profile.email,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  await sessionClient.auth.signOut();

  return NextResponse.json({ success: true });
}
