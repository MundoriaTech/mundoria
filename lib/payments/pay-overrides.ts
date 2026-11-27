import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A cleaner's admin-set pay for one booking (booking_cleaner_pay_overrides),
 * or null when their pay comes from the booking as normal. When set, it is
 * their whole pay for the booking: nothing else is added on top.
 */
export async function cleanerPayOverride(bookingId: string, cleanerId: string) {
  const { data, error } = await createAdminClient()
    .from("booking_cleaner_pay_overrides")
    .select("pay_pence")
    .eq("booking_id", bookingId)
    .eq("cleaner_id", cleanerId)
    .maybeSingle();
  // If we can't tell, don't pay out on a guess.
  if (error) throw new Error(`Couldn't check this cleaner's pay: ${error.message}`);
  return data ? Math.max(0, Number(data.pay_pence)) : null;
}
