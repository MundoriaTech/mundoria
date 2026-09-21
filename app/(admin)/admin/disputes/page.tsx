import { DisputesTable } from "@/components/admin/disputes-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
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
      <AdminPageIntro>
        Investigate evidence and resolve customer issues.
      </AdminPageIntro>
      <DisputesTable disputes={(data ?? []) as AdminDispute[]} />
    </div>
  );
}
