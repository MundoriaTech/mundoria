import { BookingsTable } from "@/components/admin/bookings-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export default async function AdminBookingsPage() {
  const { data } = await createAdminClient()
    .from("bookings")
    .select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Booking management</h1>
      <p className="mt-2 mb-7 text-muted-foreground">Search, inspect, and resolve booking edge cases.</p>
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </div>
  );
}
