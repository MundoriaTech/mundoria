import { DisputesTable } from "@/components/admin/disputes-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminDispute } from "@/types/admin";

export default async function AdminDisputesPage() {
  const { data } = await createAdminClient()
    .from("disputes")
    .select("*,booking:bookings(*),raised_by_profile:profiles!disputes_raised_by_fkey(full_name)")
    .order("created_at", { ascending: false });
  return <div><h1 className="text-3xl font-semibold">Disputes</h1><p className="mt-2 mb-7 text-muted-foreground">Investigate evidence and resolve customer issues.</p><DisputesTable disputes={(data ?? []) as AdminDispute[]} /></div>;
}
