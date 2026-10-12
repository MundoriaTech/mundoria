import { BookingsTable } from "@/components/admin/bookings-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { OPS_REFRESH_MS } from "@/lib/dashboard/live-refresh";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export default async function AdminBookingsPage() {
  const { data } = await createAdminClient()
    .from("bookings")
    .select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  return (
    <div className="min-w-0">
      <LiveDashboardRefresh intervalMs={OPS_REFRESH_MS} scope="admin-bookings" />
      <AdminPageIntro>
        Search, inspect, and resolve booking edge cases.
      </AdminPageIntro>
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </div>
  );
}
