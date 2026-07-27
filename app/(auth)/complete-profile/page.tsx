import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { dashboardForRole, safeRedirectPath } from "@/lib/auth/redirects";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole } from "@/types/auth";

export const metadata = {
  title: "Complete profile",
};

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
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
  const next = safeRedirectPath(searchParams.next ?? null, dashboardForRole(role));

  if (profile?.phone?.trim()) {
    redirect(next);
  }

  return (
    <AuthShell
      description="Google created your session. Add the details CleanScape needs for booking updates and marketplace safety."
      footer="You can switch accounts from the form above."
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
