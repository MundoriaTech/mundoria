import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CleanerShell } from "@/components/cleaner/cleaner-shell";
import { OnboardingWizard } from "@/components/cleaner/onboarding-wizard";
import { listTakenInterviewSlots } from "@/lib/cleaner/interview-availability";
import { getCleanerContext } from "@/lib/cleaner/server";
import { dashboardForRole } from "@/lib/auth/redirects";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole, type Profile } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPrivateMetadata("Cleaner");

export default async function CleanerLayout({ children }: { children: React.ReactNode }) {
  const supabase=createServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  let context=await getCleanerContext(supabase,user.id);
  if (context.profile?.role === "cleaner" && !context.cleanerProfile) {
    await createAdminClient()
      .from("cleaner_profiles")
      .upsert({ id: user.id }, { onConflict: "id" });
    context = await getCleanerContext(supabase, user.id);
  }
  if (!context.profile || !isUserRole(context.profile.role)) redirect("/login");
  if (context.profile.role !== "cleaner") {
    redirect(dashboardForRole(context.profile.role));
  }
  if (!context.cleanerProfile) {
    redirect("/login?error=Unable%20to%20finish%20cleaner%20sign-up");
  }
  if(!context.cleanerProfile.onboarding_complete) {
    const takenSlots = await listTakenInterviewSlots(user.id);
    return <OnboardingWizard cleaner={context.cleanerProfile} profile={context.profile as Profile} takenSlots={takenSlots} />;
  }
  return <CleanerShell cleaner={context.cleanerProfile} profile={context.profile as Profile}>{children}</CleanerShell>;
}
