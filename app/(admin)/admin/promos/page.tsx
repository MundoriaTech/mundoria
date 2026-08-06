import { PromosManager } from "@/components/admin/promos-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPromosPage() {
  const { data } = await createAdminClient()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Promo codes
      </h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Create incentives and monitor redemption.
      </p>
      <PromosManager promos={data ?? []} />
    </div>
  );
}
