import { BookingsTable } from "@/components/admin/bookings-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export default async function AdminBookingsPage() {
  const { data } = await createAdminClient()
    .from("bookings")
    .select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  return (
    <div className="min-w-0">
      <AdminPageIntro>
        Search, inspect, and resolve booking edge cases.
      </AdminPageIntro>
      <BookingsTable bookings={(data ?? []) as AdminBooking[]} />
    </div>
  );
}
