import { BookingsTable } from "@/components/admin/bookings-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export default async function AdminBookingsPage() {
  const { data } = await createAdminClient()
    .from("bookings")
    .select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bookings</h1>
      <p className="mb-5 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Search, inspect, and resolve booking edge cases.
      </p>
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </div>
  );
}
