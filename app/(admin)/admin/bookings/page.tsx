import { BookingsTable } from "@/components/admin/bookings-table";
import { AppPage } from "@/components/shared/app-page";
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
    <AppPage
      description="Search, inspect, and resolve booking edge cases."
      eyebrow="Operations"
      title="Bookings"
    >
      <LiveDashboardRefresh intervalMs={OPS_REFRESH_MS} scope="admin-bookings" />
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </AppPage>
  );
}
