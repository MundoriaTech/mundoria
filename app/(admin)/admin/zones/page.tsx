import { ZonesManager } from "@/components/admin/zones-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminZonesPage() {
  const { data } = await createAdminClient()
    .from("zones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <ZonesManager zones={data ?? []} />
    </div>
  );
}
