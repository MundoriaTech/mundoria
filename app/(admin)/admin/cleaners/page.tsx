import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { CleanersTable } from "@/components/admin/cleaners-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminCleaner } from "@/types/admin";

export default async function AdminCleanersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: areas }] = await Promise.all([
    fetchAllRows((from, to) =>
      admin
        .from("profiles")
        .select("id,full_name,email,phone,avatar_url,created_at,cleaner_profiles!cleaner_profiles_id_fkey(*)")
        .eq("role", "cleaner")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      admin
        .from("cleaner_working_areas")
        .select("cleaner_id,postcode_prefix")
        .order("cleaner_id")
        .range(from, to),
    ),
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
      <CleanersTable cleaners={cleaners} workingAreas={workingAreas} />
    </div>
  );
}
