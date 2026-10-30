import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import {
  VerificationQueueTable,
  type VerificationQueueRow,
} from "@/components/admin/verification-queue-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminVerificationQueuePage() {
  const { data } = await createAdminClient()
    .from("cleaner_profiles")
    .select(
      "id,status,utr_document_status,dbs_document_status,insurance_status,insurance_expiry_date,verification_flags,updated_at,profile:profiles!cleaner_profiles_id_fkey(full_name,email)",
    )
    .or(
      "utr_document_status.eq.pending,dbs_document_status.eq.pending,insurance_status.eq.pending",
    )
    .order("updated_at", { ascending: true })
    .limit(200);

  const rows = (data ?? []) as VerificationQueueRow[];

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageIntro>
        Cleaners with a UTR, DBS or insurance document waiting for review.
        Oldest updates first. {rows.length} in the queue.
      </AdminPageIntro>
      <VerificationQueueTable rows={rows} />
    </div>
  );
}
