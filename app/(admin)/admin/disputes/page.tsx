import { DisputesTable } from "@/components/admin/disputes-table";
import { AppPage } from "@/components/shared/app-page";
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
    <AppPage
      description="Investigate evidence and resolve customer issues."
      eyebrow="Operations"
      title="Disputes"
    >
      <DisputesTable disputes={(data ?? []) as AdminDispute[]} />
    </AppPage>
  );
}
