import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { BookingsTable } from "@/components/admin/bookings-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export default async function AdminBookingsPage() {
  const { data } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("bookings")
    .select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false })
      .range(from, to),
  );
  return (
    <div className="min-w-0">
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </div>
  );
}
