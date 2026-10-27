import { redirect } from "next/navigation";

import { CleanerProfileForm } from "@/components/cleaner/cleaner-profile-form";
import { AppPage } from "@/components/shared/app-page";
import { getCleanerContext } from "@/lib/cleaner/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export default async function CleanerProfilePage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const context = await getCleanerContext(supabase, user.id);
  if (!context.cleanerProfile || !context.profile) redirect("/");

  return (
    <AppPage
      description="How customers see you, the work you take, and how you get paid."
      eyebrow="Account"
      title="Your profile"
    >
      <CleanerProfileForm
        areas={context.areas}
        availability={context.availability}
        cleaner={context.cleanerProfile}
        profile={context.profile as Profile}
        services={context.services}
      />
    </AppPage>
  );
}
