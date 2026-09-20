import type { SupabaseClient } from "@supabase/supabase-js";

import { isCleanerVisibleToCustomer } from "@/lib/customer/booking-visibility";
import type {
  Booking,
  CleanerPublicProfile,
} from "@/types/customer";

export async function getCustomerBookings(
  supabase: SupabaseClient,
  customerId: string,
  options?: { ascending?: boolean; limit?: number },
) {
  let query = supabase
    .from("bookings")
    .select("*, address:addresses(*)")
    .eq("customer_id", customerId)
    .order("scheduled_date", { ascending: options?.ascending ?? true })
    .order("scheduled_start_time", { ascending: options?.ascending ?? true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const bookings = (data ?? []) as Booking[];
  const cleanerIds = Array.from(
    new Set(
      bookings
        .filter((booking) => isCleanerVisibleToCustomer(booking.status))
        .map((booking) => booking.cleaner_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (!cleanerIds.length) {
    return bookings.map((booking) => ({
      ...booking,
      cleaner: null,
    }));
  }

  const { data: cleaners } = await supabase
    .from("cleaner_public_profiles")
    .select("*")
    .in("id", cleanerIds);
  const cleanerMap = new Map(
    ((cleaners ?? []) as CleanerPublicProfile[]).map((cleaner) => [
      cleaner.id,
      cleaner,
    ]),
  );

  return bookings.map((booking) => ({
    ...booking,
    cleaner:
      booking.cleaner_id && isCleanerVisibleToCustomer(booking.status)
        ? cleanerMap.get(booking.cleaner_id) ?? null
        : null,
  }));
}
