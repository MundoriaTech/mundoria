import { isSeedEmail } from "@/lib/matching/seed-accounts";
import { MatchingQueue } from "@/components/admin/matching-queue";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBooking } from "@/types/admin";

export const metadata = { title: "Matching" };

export default async function AdminMatchingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const [{ data }, { data: cleanerRows }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,email),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)",
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
      .limit(800),
    admin
      .from("profiles")
      .select("id,full_name,email,cleaner_profiles!cleaner_profiles_id_fkey!inner(status)")
      .eq("role", "cleaner")
      .in("cleaner_profiles.status", ["certified", "active"])
      .order("full_name", { ascending: true }),
  ]);

  // Live operations only: test (seed) cleaners and test customers' bookings
  // never appear here.
  const cleaners = (cleanerRows ?? [])
    .filter((row) => !isSeedEmail(row.email as string | null))
    .map((row) => ({
      id: row.id as string,
      full_name: (row.full_name as string) || "Cleaner",
    }));

  const bookings = ((data ?? []) as AdminBooking[]).filter((booking) => {
    const customer = booking.customer as { email?: string | null } | null;
    if (isSeedEmail(customer?.email)) return false;
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
      <MatchingQueue bookings={bookings} cleaners={cleaners} today={today} />
    </div>
  );
}
