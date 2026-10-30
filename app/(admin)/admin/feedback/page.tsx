import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import {
  FeedbackList,
  type GuestFeedbackRow,
} from "@/components/admin/feedback-list";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminFeedbackPage() {
  const { data, error } = await createAdminClient()
    .from("guest_feedback")
    .select(
      "id, client_name, service_label, service_date, invoice_number, mood, comment, created_at",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as GuestFeedbackRow[];

  return (
    <div className="min-w-0">
      <AdminPageIntro>
        Written reviews from the public page. These do not appear on the
        website and do not change a cleaner’s score.
      </AdminPageIntro>
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Feedback could not be loaded yet. Apply the latest database migration
          and refresh this page.
        </p>
      ) : (
        <FeedbackList rows={rows} />
      )}
    </div>
  );
}
