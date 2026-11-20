import { CrmPageView } from "@/components/analytics/crm-page-view";
import { BookingsList } from "@/components/customer/bookings-list";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "My bookings" };

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bookings = await getCustomerBookings(supabase, user!.id);
  const tab =
    searchParams.tab === "past" || searchParams.tab === "cancelled"
      ? searchParams.tab
      : "upcoming";

  return (
    <div>
      <CrmPageView customerId={user!.id} event="view_sessions_click" />
      <LiveDashboardRefresh
        scope={`customer-bookings-${user!.id}`}
        watches={bookingWatchesFor("customer")}
      />
      <BookingsList bookings={bookings} initialTab={tab} />
    </div>
  );
}
