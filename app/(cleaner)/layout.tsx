import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CleanerShell } from "@/components/cleaner/cleaner-shell";
import { OnboardingWizard } from "@/components/cleaner/onboarding-wizard";
import { getCleanerContext } from "@/lib/cleaner/server";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPrivateMetadata("Cleaner");

export default async function CleanerLayout({ children }: { children: React.ReactNode }) {
  const supabase=createServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const context=await getCleanerContext(supabase,user.id);
  if(!context.profile || context.profile.role!=="cleaner") redirect("/");
  if(!context.cleanerProfile.onboarding_complete) return <OnboardingWizard cleaner={context.cleanerProfile} profile={context.profile as Profile} />;
  return <CleanerShell cleaner={context.cleanerProfile} profile={context.profile as Profile}>{children}</CleanerShell>;
}
