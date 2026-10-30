import { CleanersTable } from "@/components/admin/cleaners-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { loadAdminUserCounts } from "@/lib/admin/user-counts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminCleaner } from "@/types/admin";

export default async function AdminCleanersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: areas }, people] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,avatar_url,created_at,cleaner_profiles!cleaner_profiles_id_fkey(*)")
      .eq("role", "cleaner")
      .order("created_at", { ascending: false }),
    admin.from("cleaner_working_areas").select("cleaner_id,postcode_prefix"),
    loadAdminUserCounts(),
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
      <AdminPageIntro>
        {people.cleaners.toLocaleString("en-GB")} cleaner
        {people.cleaners === 1 ? "" : "s"} on Mundoria. Review applications and
        monitor quality.
      </AdminPageIntro>
      <CleanersTable cleaners={cleaners} workingAreas={workingAreas} />
    </div>
  );
}
