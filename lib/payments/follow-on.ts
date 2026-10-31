import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import {
  authorizeBookingPayment,
  createBookingSetupIntent,
  maybeAuthorizeBookingIfDue,
} from "@/lib/payments/lifecycle";
import { retryAuthAfterCardUpdate } from "@/lib/payments/preauth-flow";
import { runMatchingEngine } from "@/lib/matching/engine";

/** Create or reuse a SetupIntent so the customer can save a card for an unpaid visit. */
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
      "id,customer_id,amount_total,payment_status,status,stripe_payment_intent_id,stripe_payment_method_id,stripe_setup_intent_id,payment_auth_attempt_count",
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
    throw new Error("This booking does not need a payment method.");
  }
  const replacingCard =
    Boolean(booking.stripe_payment_method_id) &&
    booking.status === "awaiting_payment";
  if (booking.stripe_payment_method_id && !replacingCard) {
    throw new Error("A payment method is already saved for this booking.");
  }
  const amount = Number(booking.amount_total ?? 0);
  if (amount < 100) {
    throw new Error("Booking amount must be at least £1.00");
  }

  let customer = stripeCustomerId ?? null;
  if (!customer) {
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id,email,full_name,phone")
      .eq("id", customerId)
      .single();
    customer = profile?.stripe_customer_id ?? null;
    if (!customer) {
      const created = await getStripe().customers.create({
        email: profile?.email ?? undefined,
        metadata: { supabase_user_id: customerId },
        name: profile?.full_name ?? undefined,
        phone: profile?.phone ?? undefined,
      });
      customer = created.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customer })
        .eq("id", customerId);
    }
  }

  if (booking.stripe_setup_intent_id && !replacingCard) {
    try {
      const existing = await getStripe().setupIntents.retrieve(
        booking.stripe_setup_intent_id,
      );
      if (
        ["requires_payment_method", "requires_confirmation", "requires_action"].includes(
          existing.status,
        ) &&
        existing.client_secret
      ) {
        return {
          client_secret: existing.client_secret,
          setup_intent_id: existing.id,
        };
      }
    } catch {
      // Create a fresh SetupIntent below.
    }
  }

  const attemptTag = replacingCard
    ? `r${booking.payment_auth_attempt_count ?? 0}_${Date.now()}`
    : "initial";
  const setupIntent = await createBookingSetupIntent({
    amount,
    customerId,
    idempotencyKey: `followon_setup_${bookingId}_${amount}_${attemptTag}`,
    metadata: {
      amount_pence: String(amount),
      booking_id: bookingId,
      replace_card: replacingCard ? "1" : "0",
    },
    stripeCustomerId: customer,
  });
  if (!setupIntent.client_secret) {
    throw new Error("Could not create setup intent.");
  }
  await admin
    .from("bookings")
    .update({
      stripe_setup_intent_id: setupIntent.id,
      ...(replacingCard ? { stripe_payment_method_id: null } : {}),
    })
    .eq("id", bookingId);

  return {
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
  };
}

/**
 * After the customer confirms a SetupIntent (or an older hold), mark the method
 * saved and kick off matching. Pre-auth runs later via cron / cleaner confirm,
 * or immediately when the booking is awaiting payment after a card update.
 */
export async function confirmBookingPaymentHold(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,payment_status,status,stripe_payment_intent_id,stripe_setup_intent_id,stripe_payment_method_id,customer_id",
    )
    .eq("id", bookingId)
    .single();
  if (!booking) throw new Error("Booking not found.");

  const stripe = getStripe();
  let paymentMethodId = booking.stripe_payment_method_id as string | null;
  let paymentStatus: "unpaid" | "held" | "released" = "unpaid";

  if (booking.stripe_setup_intent_id) {
    const setup = await stripe.setupIntents.retrieve(
      booking.stripe_setup_intent_id,
      { expand: ["payment_method"] },
    );
    if (setup.status === "succeeded") {
      const fromSetup =
        typeof setup.payment_method === "string"
          ? setup.payment_method
          : setup.payment_method?.id ?? null;
      if (fromSetup) paymentMethodId = fromSetup;
    } else if (!paymentMethodId) {
      throw new Error("Card has not been saved yet.");
    }
  }

  if (booking.stripe_payment_intent_id) {
    const intent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id,
    );
    if (intent.status === "requires_capture") paymentStatus = "held";
    if (intent.status === "succeeded") paymentStatus = "released";
    const pm =
      typeof intent.payment_method === "string"
        ? intent.payment_method
        : intent.payment_method?.id;
    if (pm && !paymentMethodId) paymentMethodId = pm;
  }

  if (!paymentMethodId && paymentStatus === "unpaid") {
    throw new Error("Payment method has not been saved yet.");
  }

  await admin
    .from("bookings")
    .update({
      payment_status: paymentStatus,
      stripe_payment_method_id: paymentMethodId,
    })
    .eq("id", bookingId)
    .in("payment_status", ["unpaid", "held"]);

  if (booking.status === "pending_match") {
    await runMatchingEngine(bookingId);
  }

  if (paymentStatus === "unpaid" && paymentMethodId) {
    if (booking.status === "awaiting_payment") {
      await retryAuthAfterCardUpdate(bookingId);
    } else {
      await maybeAuthorizeBookingIfDue(bookingId);
    }
  }

  return { payment_status: paymentStatus };
}

export { authorizeBookingPayment, maybeAuthorizeBookingIfDue };
