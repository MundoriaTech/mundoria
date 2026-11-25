import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { DisputesTable } from "@/components/admin/disputes-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminDispute } from "@/types/admin";

export default async function AdminDisputesPage() {
  const { data } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("disputes")
    .select(
      "*,booking:bookings(*),raised_by_profile:profiles!disputes_raised_by_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
      .range(from, to),
  );

  return (
    <div className="min-w-0">
      <DisputesTable disputes={(data ?? []) as AdminDispute[]} />
    </div>
  );
}
