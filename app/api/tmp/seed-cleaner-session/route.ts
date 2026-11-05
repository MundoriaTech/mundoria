import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Temporary local helper. Remove after QA. Signs in demo cleaner for real onboarding. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", "demo.cleaner@seed.mundoria.local")
    .maybeSingle();

  if (profile?.id) {
    await admin
      .from("cleaner_profiles")
      .update({ onboarding_complete: false })
      .eq("id", profile.id);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.signInWithPassword({
    email: "demo.cleaner@seed.mundoria.local",
    password: "SeedPass123!",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL("/cleaner/dashboard", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  );
}
