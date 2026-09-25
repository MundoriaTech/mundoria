import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { redirectForRole } from "@/lib/auth/redirects";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete profile",
};

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (!hasSupabasePublicConfig()) {
    redirect("/setup");
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Sign%20in%20to%20complete%20your%20profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,phone,role")
    .eq("id", user.id)
    .single();
  const role = isUserRole(profile?.role) ? profile.role : "customer";
  const next = redirectForRole(role, searchParams.next ?? null);

  if (profile?.phone?.trim()) {
    redirect(next);
  }

  return (
    <AuthShell
      description={
        role === "cleaner"
          ? "Google created your session. Add a phone number so Mundoria can reach you about jobs."
          : "Google created your session. Add the details Mundoria needs for booking updates and marketplace safety."
      }
      footer="Need a different account type? Sign out and create the matching customer or cleaner account."
      title="Complete your profile"
    >
      <CompleteProfileForm
        defaultFullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
        defaultPhone={profile?.phone ?? ""}
        next={next}
      />
    </AuthShell>
  );
}
