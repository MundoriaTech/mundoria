import { ZonesManager } from "@/components/admin/zones-manager";
import { AppPage } from "@/components/shared/app-page";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminZonesPage() {
  const { data } = await createAdminClient()
    .from("zones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AppPage
      description="Control postcode coverage and launches."
      eyebrow="Money & coverage"
      title="Zones"
    >
      <ZonesManager zones={data ?? []} />
    </AppPage>
  );
}
