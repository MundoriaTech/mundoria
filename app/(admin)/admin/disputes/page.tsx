import { DisputesTable } from "@/components/admin/disputes-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminDispute } from "@/types/admin";

export default async function AdminDisputesPage() {
  const { data } = await createAdminClient()
    .from("disputes")
    .select(
      "*,booking:bookings(*),raised_by_profile:profiles!disputes_raised_by_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Disputes
      </h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Investigate evidence and resolve customer issues.
      </p>
      <DisputesTable disputes={(data ?? []) as AdminDispute[]} />
    </div>
  );
}
