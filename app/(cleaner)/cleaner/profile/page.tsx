import { redirect } from "next/navigation";

import { CleanerProfileForm } from "@/components/cleaner/cleaner-profile-form";
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
    <div>
      <h1 className="text-3xl font-semibold">Profile</h1>
      <p className="mt-2 mb-7 text-muted-foreground">
        Manage your services, areas, documents, and payout preferences.
      </p>
      <CleanerProfileForm
        areas={context.areas}
        availability={context.availability}
        cleaner={context.cleanerProfile}
        profile={context.profile as Profile}
        services={context.services}
      />
    </div>
  );
}
