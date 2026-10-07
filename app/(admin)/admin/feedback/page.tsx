import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import {
  formatGuestFeedbackDate,
  guestFeedbackMoodLabel,
} from "@/lib/guest-feedback";
import { createAdminClient } from "@/lib/supabase/admin";

type GuestFeedbackRow = {
  client_name: string;
  comment: string | null;
  created_at: string;
  id: string;
  invoice_number: string | null;
  mood: string | null;
  service_date: string | null;
  service_label: string | null;
};

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
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#5a5470]">No feedback yet.</p>
      ) : (
        <ul className="grid gap-4">
          {rows.map((row) => (
            <li
              className="rounded-2xl border border-[#e6e0f2] bg-white p-5"
              key={row.id}
            >
              <p className="text-sm font-semibold text-[#312c79]">
                {[
                  row.client_name.trim(),
                  row.mood ? guestFeedbackMoodLabel(row.mood) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {row.service_label || row.service_date || row.invoice_number ? (
                <p className="mt-1 text-sm text-[#5a5470]">
                  {[
                    row.service_label,
                    row.service_date
                      ? `on ${formatGuestFeedbackDate(row.service_date)}`
                      : null,
                    row.invoice_number,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {row.comment ? (
                <p className="mt-3 text-sm leading-6 text-[#1c133b]">{row.comment}</p>
              ) : (
                <p className="mt-3 text-sm text-[#5a5470]">No written comment.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
