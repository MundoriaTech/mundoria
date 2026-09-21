import { PromosManager } from "@/components/admin/promos-manager";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPromosPage() {
  const { data } = await createAdminClient()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <AdminPageIntro>
        Create incentives and monitor redemption.
      </AdminPageIntro>
      <PromosManager promos={data ?? []} />
    </div>
  );
}
