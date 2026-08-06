import { CleanersTable } from "@/components/admin/cleaners-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminCleaner } from "@/types/admin";

export default async function AdminCleanersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: areas }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,avatar_url,created_at,cleaner_profiles!cleaner_profiles_id_fkey(*)")
      .eq("role", "cleaner")
      .order("created_at", { ascending: false }),
    admin.from("cleaner_working_areas").select("cleaner_id,postcode_prefix"),
  ]);
  const workingAreas: Record<string, string[]> = {};
  (areas ?? []).forEach((area) => {
    if (!workingAreas[area.cleaner_id]) workingAreas[area.cleaner_id] = [];
    if (area.postcode_prefix) workingAreas[area.cleaner_id].push(area.postcode_prefix);
  });
  const cleaners = (profiles ?? []).map((profile) => ({
    ...profile,
    cleaner_profiles: Array.isArray(profile.cleaner_profiles)
      ? profile.cleaner_profiles[0] ?? null
      : profile.cleaner_profiles,
  })) as AdminCleaner[];
  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cleaners</h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Review applications and monitor cleaner quality.
      </p>
      <CleanersTable cleaners={cleaners} workingAreas={workingAreas} />
    </div>
  );
}
