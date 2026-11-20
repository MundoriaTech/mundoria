import { MatchingQueue } from "@/components/admin/matching-queue";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { OPS_REFRESH_MS } from "@/lib/dashboard/live-refresh";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export const metadata = { title: "Matching" };

export default async function AdminMatchingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await createAdminClient()
    .from("bookings")
    .select(
      "*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)",
    )
    .in("status", [
      "pending_match",
      "matched",
      "awaiting_payment",
      "confirmed",
      "cleaner_en_route",
      "in_progress",
      "awaiting_customer_confirmation",
      "disputed",
      "no_show",
      "cancelled",
    ])
    .order("scheduled_date", { ascending: true })
    .limit(800);

  const bookings = ((data ?? []) as AdminBooking[]).filter((booking) => {
    if (booking.status === "cancelled") {
      return booking.payment_status === "held";
    }
    if (
      booking.status === "confirmed" ||
      booking.status === "cleaner_en_route" ||
      booking.status === "in_progress" ||
      booking.status === "awaiting_customer_confirmation"
    ) {
      return booking.scheduled_date === today;
    }
    return true;
  });

  return (
    <div className="min-w-0">
      <LiveDashboardRefresh intervalMs={OPS_REFRESH_MS} scope="admin-matching" />
      <MatchingQueue bookings={bookings} today={today} />
    </div>
  );
}
