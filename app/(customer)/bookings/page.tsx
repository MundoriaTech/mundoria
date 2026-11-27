import { CrmPageView } from "@/components/analytics/crm-page-view";
import { BookingsList } from "@/components/customer/bookings-list";
import { ONGOING_STATUSES } from "@/lib/customer/session-tabs";
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
  // Open on Ongoing when a visit is happening now, unless a tab was asked for.
  const asked = ["upcoming", "ongoing", "past", "cancelled"].includes(searchParams.tab ?? "")
    ? (searchParams.tab as "upcoming" | "ongoing" | "past" | "cancelled")
    : null;
  const tab =
    asked ?? (bookings.some((b) => ONGOING_STATUSES.includes(b.status)) ? "ongoing" : "upcoming");

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
