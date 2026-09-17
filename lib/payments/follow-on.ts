import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { createManualPaymentIntent } from "@/lib/payments/service";
import { runMatchingEngine } from "@/lib/matching/engine";

/** Create or reuse a confirmable PaymentIntent for an unpaid booking. */
export async function ensureBookingPaymentIntent({
  bookingId,
  customerId,
  stripeCustomerId,
}: {
  bookingId: string;
  customerId: string;
  stripeCustomerId?: string | null;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,amount_total,payment_status,status,stripe_payment_intent_id",
    )
    .eq("id", bookingId)
    .single();

  if (!booking || booking.customer_id !== customerId) {
    throw new Error("Booking not found.");
  }
  if (booking.status === "cancelled") {
    throw new Error("This booking was cancelled.");
  }
  if (booking.payment_status !== "unpaid") {
    throw new Error("This booking does not need payment.");
  }
  const amount = Number(booking.amount_total ?? 0);
  if (amount < 100) {
    throw new Error("Booking amount must be at least £1.00");
  }

  if (booking.stripe_payment_intent_id) {
    try {
      const existing = await getStripe().paymentIntents.retrieve(
        booking.stripe_payment_intent_id,
      );
      if (
        [
          "requires_payment_method",
          "requires_confirmation",
          "requires_action",
        ].includes(existing.status) &&
        existing.client_secret
      ) {
        return {
          client_secret: existing.client_secret,
          payment_intent_id: existing.id,
        };
      }
      if (
        existing.status === "requires_capture" ||
        existing.status === "succeeded"
      ) {
        throw new Error("Payment is already authorised for this booking.");
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("already authorised")
      ) {
        throw error;
      }
    }
  }

  const intent = await createManualPaymentIntent({
    amount,
    bookingId,
    customerId,
    stripeCustomerId,
  });
  if (!intent.client_secret) {
    throw new Error("Could not create payment intent.");
  }
  return {
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
  };
}

/** Mark hold as held/released and kick off matching for unpaid follow-ons. */
export async function confirmBookingPaymentHold(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,payment_status,status,stripe_payment_intent_id")
    .eq("id", bookingId)
    .single();
  if (!booking) throw new Error("Booking not found.");

  let paymentStatus: "held" | "released" = "held";
  if (booking.stripe_payment_intent_id) {
    const intent = await getStripe().paymentIntents.retrieve(
      booking.stripe_payment_intent_id,
    );
    if (!["requires_capture", "succeeded"].includes(intent.status)) {
      throw new Error("Payment has not been authorised yet.");
    }
    if (intent.status === "succeeded") paymentStatus = "released";
  }

  await admin
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId)
    .in("payment_status", ["unpaid", "held"]);

  if (booking.status === "pending_match") {
    await runMatchingEngine(bookingId);
  }

  return { payment_status: paymentStatus };
}
