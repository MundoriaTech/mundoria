import { PromosManager } from "@/components/admin/promos-manager";
import { AppPage } from "@/components/shared/app-page";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPromosPage() {
  const { data } = await createAdminClient()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AppPage
      description="Create incentives and monitor redemption."
      eyebrow="Money & coverage"
      title="Promos"
    >
      <PromosManager promos={data ?? []} />
    </AppPage>
  );
}
