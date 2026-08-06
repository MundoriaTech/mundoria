import { ZonesManager } from "@/components/admin/zones-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminZonesPage() {
  const { data } = await createAdminClient()
    .from("zones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Service zones
      </h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Control postcode coverage and launches.
      </p>
      <ZonesManager zones={data ?? []} />
    </div>
  );
}
