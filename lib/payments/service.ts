import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

import { maybeRewardReferrer } from "@/lib/customer/referrals";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function createManualPaymentIntent({
  amount,
  bookingId,
  customerId,
  stripeCustomerId,
}: {
  amount: number;
  bookingId?: string;
  customerId: string;
  stripeCustomerId?: string | null;
}) {
  const intent = await getStripe().paymentIntents.create({
    amount,
    currency: "gbp",
    customer: stripeCustomerId ?? undefined,
    metadata: {
      booking_id: bookingId ?? "",
      supabase_user_id: customerId,
    },
    setup_future_usage: "off_session",
  });
  if (bookingId) {
    await createAdminClient()
      .from("bookings")
      .update({
        amount_total: amount,
        payment_status: "unpaid",
        stripe_payment_intent_id: intent.id,
      })
      .eq("id", bookingId)
      .eq("customer_id", customerId);
  }
  return intent;
}

export async function scheduleCleanerPayout(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("cleaner_id,amount_total,amount_cleaner")
    .eq("id", bookingId)
    .single();
  if (!booking?.cleaner_id) throw new Error("Assigned cleaner not found.");
  const { data: cleaner } = await admin
    .from("cleaner_profiles")
    .select("payout_preference")
    .eq("id", booking.cleaner_id)
    .single();
  const today = new Date();
  const weekly = cleaner?.payout_preference !== "monthly";
  const periodStart = weekly
    ? startOfWeek(today, { weekStartsOn: 1 })
    : startOfMonth(today);
  const periodEnd = weekly
    ? endOfWeek(today, { weekStartsOn: 1 })
    : endOfMonth(today);
  const { data: existing } = await admin
    .from("payouts")
    .select("*")
    .eq("cleaner_id", booking.cleaner_id)
    .eq("period_start", periodStart.toISOString().slice(0, 10))
    .eq("period_end", periodEnd.toISOString().slice(0, 10))
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    await admin
      .from("payouts")
      .update({
        gross_amount: existing.gross_amount + (booking.amount_total ?? 0),
        net_amount: existing.net_amount + (booking.amount_cleaner ?? 0),
        total_jobs: existing.total_jobs + 1,
      })
      .eq("id", existing.id);
    return existing.id;
  }
  const { data: payout, error } = await admin
    .from("payouts")
    .insert({
      cleaner_id: booking.cleaner_id,
      gross_amount: booking.amount_total ?? 0,
      net_amount: booking.amount_cleaner ?? 0,
      period_end: periodEnd.toISOString().slice(0, 10),
      period_start: periodStart.toISOString().slice(0, 10),
      status: "pending",
      total_jobs: 1,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return payout.id;
}

export async function captureBookingPayment(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("stripe_payment_intent_id,payment_status")
    .eq("id", bookingId)
    .single();
  if (!booking?.stripe_payment_intent_id) {
    throw new Error("Booking has no PaymentIntent.");
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(
    booking.stripe_payment_intent_id,
  );
  if (intent.status === "requires_capture") {
    await stripe.paymentIntents.capture(intent.id);
  } else if (intent.status !== "succeeded") {
    throw new Error(`PaymentIntent cannot be captured from ${intent.status}.`);
  }
  await admin
    .from("bookings")
    .update({ payment_status: "released" })
    .eq("id", bookingId);
  const payoutId = await scheduleCleanerPayout(bookingId);
  try {
    await maybeRewardReferrer(bookingId);
  } catch {
    // Referral rewards should not block payment capture.
  }
  return { intentId: intent.id, payoutId };
}

export async function refundBookingPayment(
  bookingId: string,
  amount?: number,
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("stripe_payment_intent_id")
    .eq("id", bookingId)
    .single();
  if (!booking?.stripe_payment_intent_id) {
    throw new Error("Booking has no PaymentIntent.");
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(
    booking.stripe_payment_intent_id,
  );
  if (intent.status === "succeeded") {
    await stripe.refunds.create({
      amount,
      payment_intent: intent.id,
      reason: "requested_by_customer",
    });
  } else if (!["canceled", "requires_payment_method"].includes(intent.status)) {
    await stripe.paymentIntents.cancel(intent.id);
  }
  await admin
    .from("bookings")
    .update({ payment_status: "refunded" })
    .eq("id", bookingId);
  return intent.id;
}

export async function processCleanerPayout(payoutId: string) {
  const admin = createAdminClient();
  const { data: payout } = await admin
    .from("payouts")
    .select("*,profile:profiles!payouts_cleaner_id_fkey(stripe_account_id)")
    .eq("id", payoutId)
    .single();
  if (!payout?.profile?.stripe_account_id) {
    throw new Error("Cleaner Stripe account is missing.");
  }
  const transfer = await getStripe().transfers.create({
    amount: payout.net_amount,
    currency: "gbp",
    destination: payout.profile.stripe_account_id,
    metadata: { payout_id: payout.id },
  });
  await admin
    .from("payouts")
    .update({
      processed_at: new Date().toISOString(),
      status: "paid",
      stripe_transfer_id: transfer.id,
    })
    .eq("id", payout.id);
  return transfer;
}

export function payoutDueDate(preference: "weekly" | "monthly") {
  const now = new Date();
  return preference === "weekly"
    ? addDays(endOfWeek(now, { weekStartsOn: 1 }), 1)
    : addDays(endOfMonth(now), 1);
}
