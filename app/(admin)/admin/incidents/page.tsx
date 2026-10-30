import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import {
  IncidentsTable,
  type IncidentRow,
} from "@/components/admin/incidents-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage() {
  const { data } = await createAdminClient()
    .from("cleaner_incidents")
    .select(
      "id,title,category,severity,status,riddor_required,created_at,cleaner:profiles!cleaner_incidents_cleaner_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as IncidentRow[];
  const open = rows.filter(
    (row) => row.status !== "resolved" && row.status !== "closed",
  ).length;

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageIntro>
        Incidents reported by cleaners. {open} open. Flag anything that may need
        RIDDOR reporting.
      </AdminPageIntro>
      <IncidentsTable rows={rows} />
    </div>
  );
}
