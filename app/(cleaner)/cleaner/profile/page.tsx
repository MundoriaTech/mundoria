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
    <div className="space-y-8 pb-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          Account
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          Your profile
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c5670]">
          How customers see you, the work you take, and how you get paid.
        </p>
      </div>
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
