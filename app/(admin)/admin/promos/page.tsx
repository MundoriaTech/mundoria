import { PromosManager } from "@/components/admin/promos-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPromosPage() {
  const { data } = await createAdminClient()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <PromosManager promos={data ?? []} />
    </div>
  );
}
