import type Stripe from "stripe";

import { addPayoutAmount, chargeIdOf } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const TIP_MIN_PENCE = 100;
export const TIP_MAX_PENCE = 10_000;

/**
 * Record a succeeded tip once and pay the whole amount to the cleaner in
 * their next payout. A repeated call for the same booking does nothing.
 */
export async function recordTipPayment(input: {
  bookingId: string;
  customerId: string;
  intent: Stripe.PaymentIntent;
}) {
  const admin = createAdminClient();
  const { data: tipped, error } = await admin
    .from("bookings")
    .update({ tip_pence: input.intent.amount })
    .eq("id", input.bookingId)
    .eq("customer_id", input.customerId)
    .or("tip_pence.is.null,tip_pence.eq.0")
    .select("cleaner_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (tipped?.cleaner_id) {
    await addPayoutAmount({
      bookingId: input.bookingId,
      chargeId: chargeIdOf(input.intent),
      cleanerId: tipped.cleaner_id as string,
      grossPence: input.intent.amount,
      kind: "tip",
      netPence: input.intent.amount,
    });
  }
  return input.intent.amount;
}
