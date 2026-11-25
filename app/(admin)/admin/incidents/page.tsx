import { fetchAllRows } from "@/lib/supabase/fetch-all";
import {
  IncidentsTable,
  type IncidentRow,
} from "@/components/admin/incidents-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage() {
  const { data } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("cleaner_incidents")
    .select(
      "id,title,category,severity,status,riddor_required,created_at,cleaner:profiles!cleaner_incidents_cleaner_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
      .range(from, to),
  );

  const rows = (data ?? []) as IncidentRow[];

  return (
    <div className="min-w-0">
      <IncidentsTable rows={rows} />
    </div>
  );
}
