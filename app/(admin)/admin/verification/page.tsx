import { fetchAllRows } from "@/lib/supabase/fetch-all";
import {
  VerificationQueueTable,
  type VerificationQueueRow,
} from "@/components/admin/verification-queue-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminVerificationQueuePage() {
  const { data } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("cleaner_profiles")
    .select(
      "id,status,utr_document_status,dbs_document_status,insurance_status,id_document_status,headshot_status,right_to_work_status,insurance_expiry_date,verification_flags,updated_at,profile:profiles!cleaner_profiles_id_fkey(full_name,email)",
    )
    .or(
      "utr_document_status.eq.pending,dbs_document_status.eq.pending,insurance_status.eq.pending,id_document_status.eq.pending,headshot_status.eq.pending,right_to_work_status.eq.pending",
    )
    .order("updated_at", { ascending: true })
      .range(from, to),
  );

  const rows = (data ?? []) as VerificationQueueRow[];

  return (
    <div className="min-w-0">
      <VerificationQueueTable rows={rows} />
    </div>
  );
}
