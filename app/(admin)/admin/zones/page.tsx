import { ZonesManager } from "@/components/admin/zones-manager";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminZonesPage() {
  const { data } = await createAdminClient()
    .from("zones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <AdminPageIntro>
        Control postcode coverage and launches.
      </AdminPageIntro>
      <ZonesManager zones={data ?? []} />
    </div>
  );
}
