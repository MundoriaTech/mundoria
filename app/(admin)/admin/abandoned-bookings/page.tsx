import { AbandonedBookingLeadsTable } from "@/components/admin/abandoned-booking-leads-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";

export const metadata = { title: "Abandoned bookings" };

function serviceLabelFromDraft(draft: unknown): string | null {
  if (!draft || typeof draft !== "object") return null;
  const serviceType = (draft as { serviceType?: unknown }).serviceType;
  if (typeof serviceType !== "string" || !serviceType.trim()) return null;
  try {
    return formatServiceName(serviceType as ServiceType);
  } catch {
    return serviceType.replaceAll("_", " ");
  }
}

export default async function AdminAbandonedBookingsPage() {
  const { data, error } = await createAdminClient()
    .from("booking_drafts")
    .select(
      "id,email,user_id,current_step,reminder_count,last_reminded_at,created_at,completed_at,completed_booking_id,draft",
    )
    .gt("reminder_count", 0)
    .order("last_reminded_at", { ascending: false, nullsFirst: false });

  const rows = (data ?? []).map((row) => ({
    completed_at: row.completed_at as string | null,
    completed_booking_id: row.completed_booking_id as string | null,
    created_at: row.created_at as string,
    current_step: row.current_step as string | null,
    email: row.email as string,
    id: row.id as string,
    last_reminded_at: row.last_reminded_at as string | null,
    reminder_count: Number(row.reminder_count ?? 0),
    service_label: serviceLabelFromDraft(row.draft),
    user_id: row.user_id as string | null,
  }));

  const stillOpen = rows.filter((row) => !row.completed_at).length;

  return (
    <div className="min-w-0">
      <AdminPageIntro>
        People who were sent the “Finish your Mundoria booking” email after
        leaving a booking mid-flow. {rows.length ? (
          <>
            {rows.length} emailed
            {stillOpen ? ` · ${stillOpen} still open` : null}.
          </>
        ) : null}
      </AdminPageIntro>
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Abandoned booking leads could not be loaded. Apply the latest database
          migration and refresh this page.
        </p>
      ) : (
        <AbandonedBookingLeadsTable rows={rows} />
      )}
    </div>
  );
}
