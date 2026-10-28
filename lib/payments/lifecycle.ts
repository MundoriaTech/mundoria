import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { captureBookingPayment } from "@/lib/payments/service";
import {
  bookingStartUtc,
  nextDayCaptureAtUk,
} from "@/lib/payments/uk-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const PREAUTH_STATUSES = [
  "confirmed",
  "cleaner_en_route",
  "in_progress",
] as const;

export type PaymentTimingSettings = {
  payment_preauth_hours_before: number;
  payment_capture_hour_uk: number;
  payment_capture_minute_uk: number;
};

export async function getPaymentTimingSettings(): Promise<PaymentTimingSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select(
      "payment_preauth_hours_before,payment_capture_hour_uk,payment_capture_minute_uk",
    )
    .eq("id", true)
    .maybeSingle();
  return {
    payment_capture_hour_uk: data?.payment_capture_hour_uk ?? 10,
    payment_capture_minute_uk: data?.payment_capture_minute_uk ?? 0,
    payment_preauth_hours_before: data?.payment_preauth_hours_before ?? 24,
  };
}

/** Create a SetupIntent so the customer can save a card without a hold. */
export async function createBookingSetupIntent({
  amount,
  customerId,
  idempotencyKey,
  metadata,
  stripeCustomerId,
}: {
  amount: number;
  customerId: string;
  idempotencyKey?: string;
  metadata: Record<string, string>;
  stripeCustomerId: string;
}) {
  const setupIntent = await getStripe().setupIntents.create(
    {
      customer: stripeCustomerId,
      metadata: {
        ...metadata,
        amount_pence: String(amount),
        supabase_user_id: customerId,
      },
      payment_method_types: ["card"],
      usage: "off_session",
    },
    idempotencyKey
      ? { idempotencyKey: idempotencyKey.slice(0, 255) }
      : undefined,
  );
  return setupIntent;
}

/**
 * Reuse a card already on the Stripe Customer — confirm a SetupIntent
 * server-side so booking creation can keep verifying via setupIntentId.
 */
export async function confirmBookingSetupIntentWithSavedCard({
  amount,
  customerId,
  idempotencyKey,
  metadata,
  paymentMethodId,
  stripeCustomerId,
}: {
  amount: number;
  customerId: string;
  idempotencyKey?: string;
  metadata: Record<string, string>;
  paymentMethodId: string;
  stripeCustomerId: string;
}) {
  const stripe = getStripe();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const owner =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id ?? null;
  if (owner !== stripeCustomerId) {
    throw new Error("That card does not belong to this account.");
  }
  if (paymentMethod.type !== "card") {
    throw new Error("Only card payment methods can be used for bookings.");
  }

  return stripe.setupIntents.create(
    {
      confirm: true,
      customer: stripeCustomerId,
      metadata: {
        ...metadata,
        amount_pence: String(amount),
        supabase_user_id: customerId,
      },
      payment_method: paymentMethodId,
      payment_method_types: ["card"],
      usage: "off_session",
    },
    idempotencyKey
      ? { idempotencyKey: idempotencyKey.slice(0, 255) }
      : undefined,
  );
}

/**
 * Off-session manual-capture PaymentIntent using the saved card.
 * Sets payment_status to held when requires_capture / succeeded.
 */
export async function authorizeBookingPayment(bookingId: string): Promise<{
  authorized: boolean;
  intentId?: string;
  reason?: string;
  requiresAction?: boolean;
}> {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,amount_total,payment_status,status,stripe_payment_intent_id,stripe_payment_method_id,cleaner_id",
    )
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { authorized: false, reason: "Booking not found." };
  }
  if (booking.status === "cancelled") {
    return { authorized: false, reason: "Booking cancelled." };
  }
  if (booking.payment_status === "held" || booking.payment_status === "released") {
    return {
      authorized: true,
      intentId: booking.stripe_payment_intent_id ?? undefined,
    };
  }
  if (booking.payment_status === "refunded") {
    return { authorized: false, reason: "Booking was refunded." };
  }
  if (!PREAUTH_STATUSES.includes(booking.status as (typeof PREAUTH_STATUSES)[number])) {
    return {
      authorized: false,
      reason: "Cleaner has not confirmed this booking yet.",
    };
  }
  if (!booking.cleaner_id) {
    return { authorized: false, reason: "No cleaner assigned." };
  }

  const amount = Number(booking.amount_total ?? 0);
  if (amount < 100) {
    return { authorized: false, reason: "Invalid booking amount." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", booking.customer_id)
    .single();

  let paymentMethodId = booking.stripe_payment_method_id as string | null;
  if (!paymentMethodId && booking.stripe_payment_intent_id) {
    try {
      const existing = await getStripe().paymentIntents.retrieve(
        booking.stripe_payment_intent_id,
      );
      const pm =
        typeof existing.payment_method === "string"
          ? existing.payment_method
          : existing.payment_method?.id;
      if (pm) paymentMethodId = pm;
      if (
        existing.status === "requires_capture" ||
        existing.status === "succeeded"
      ) {
        await admin
          .from("bookings")
          .update({
            payment_authorized_at: new Date().toISOString(),
            payment_preauth_failed_at: null,
            payment_preauth_failure_reason: null,
            payment_status:
              existing.status === "succeeded" ? "released" : "held",
            stripe_payment_method_id: paymentMethodId,
          })
          .eq("id", bookingId);
        return { authorized: true, intentId: existing.id };
      }
    } catch {
      // Fall through to create a fresh intent.
    }
  }

  if (!paymentMethodId || !profile?.stripe_customer_id) {
    const reason = "No saved payment method on this booking.";
    await markPreauthFailure(bookingId, booking.customer_id, reason);
    return { authorized: false, reason };
  }

  const stripe = getStripe();
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount,
        capture_method: "manual",
        confirm: true,
        currency: "gbp",
        customer: profile.stripe_customer_id,
        metadata: {
          booking_id: bookingId,
          supabase_user_id: booking.customer_id,
        },
        off_session: true,
        payment_method: paymentMethodId,
      },
      { idempotencyKey: `preauth_${bookingId}_${amount}`.slice(0, 255) },
    );

    if (intent.status === "requires_action") {
      const reason =
        "Your bank needs extra confirmation before we can hold the payment.";
      await admin
        .from("bookings")
        .update({
          payment_preauth_failed_at: new Date().toISOString(),
          payment_preauth_failure_reason: reason,
          stripe_payment_intent_id: intent.id,
        })
        .eq("id", bookingId);
      await notifyCustomerPaymentIssue(
        booking.customer_id,
        bookingId,
        "Confirm your card",
        reason,
      );
      return {
        authorized: false,
        intentId: intent.id,
        reason,
        requiresAction: true,
      };
    }

    if (
      intent.status !== "requires_capture" &&
      intent.status !== "succeeded"
    ) {
      const reason = `Pre-authorisation ended in status ${intent.status}.`;
      await markPreauthFailure(bookingId, booking.customer_id, reason);
      return { authorized: false, intentId: intent.id, reason };
    }

    await admin
      .from("bookings")
      .update({
        payment_authorized_at: new Date().toISOString(),
        payment_preauth_failed_at: null,
        payment_preauth_failure_reason: null,
        payment_status: intent.status === "succeeded" ? "released" : "held",
        stripe_payment_intent_id: intent.id,
        stripe_payment_method_id: paymentMethodId,
      })
      .eq("id", bookingId);

    return { authorized: true, intentId: intent.id };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Card pre-authorisation failed.";
    await markPreauthFailure(bookingId, booking.customer_id, reason);
    await alertAdmins(
      "payment_failed",
      "Booking pre-authorisation failed",
      reason,
      { booking_id: bookingId },
    );
    return { authorized: false, reason };
  }
}

/**
 * Pre-auth when a cleaner is confirmed and the visit is inside the
 * configurable T−N window (or already past that window).
 */
export async function maybeAuthorizeBookingIfDue(bookingId: string) {
  const settings = await getPaymentTimingSettings();
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,payment_status,status,cleaner_id,scheduled_date,scheduled_start_time,stripe_payment_method_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { authorized: false, reason: "Booking not found." };
  if (booking.payment_status !== "unpaid") {
    return { authorized: booking.payment_status === "held" };
  }
  if (!booking.cleaner_id) {
    return { authorized: false, reason: "No cleaner assigned." };
  }
  if (!PREAUTH_STATUSES.includes(booking.status as (typeof PREAUTH_STATUSES)[number])) {
    return { authorized: false, reason: "Cleaner not confirmed." };
  }
  if (!booking.stripe_payment_method_id) {
    return { authorized: false, reason: "No payment method." };
  }

  const start = bookingStartUtc(
    booking.scheduled_date,
    String(booking.scheduled_start_time),
  );
  if (!start) {
    return { authorized: false, reason: "Invalid schedule." };
  }

  const hoursUntil =
    (start.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil > settings.payment_preauth_hours_before) {
    return {
      authorized: false,
      reason: `Pre-auth opens ${settings.payment_preauth_hours_before}h before the visit.`,
    };
  }

  return authorizeBookingPayment(bookingId);
}

/** After checkout: keep the hold and schedule next-day UK capture. */
export async function scheduleNextDayCapture(bookingId: string) {
  const settings = await getPaymentTimingSettings();
  const captureAt = nextDayCaptureAtUk({
    hour: settings.payment_capture_hour_uk,
    minute: settings.payment_capture_minute_uk,
  });
  const admin = createAdminClient();
  await admin
    .from("bookings")
    .update({
      payment_capture_scheduled_for: captureAt.toISOString(),
    })
    .eq("id", bookingId)
    .eq("payment_status", "held");
  return captureAt;
}

/** Cron: pre-authorise bookings that entered the T−N window with a confirmed cleaner. */
export async function processDuePreauths(limit = 50) {
  const settings = await getPaymentTimingSettings();
  const admin = createAdminClient();
  const horizonMs =
    settings.payment_preauth_hours_before * 60 * 60 * 1000 + 60 * 60 * 1000;
  const horizonDate = new Date(Date.now() + horizonMs);
  const horizonDay = horizonDate.toISOString().slice(0, 10);

  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id,scheduled_date,scheduled_start_time,status,cleaner_id,stripe_payment_method_id",
    )
    .eq("payment_status", "unpaid")
    .in("status", [...PREAUTH_STATUSES])
    .not("cleaner_id", "is", null)
    .not("stripe_payment_method_id", "is", null)
    .lte("scheduled_date", horizonDay)
    .gte("scheduled_date", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .limit(limit);

  let authorized = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const booking of bookings ?? []) {
    const start = bookingStartUtc(
      booking.scheduled_date,
      String(booking.scheduled_start_time),
    );
    if (!start) {
      skipped += 1;
      continue;
    }
    const hoursUntil =
      (start.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > settings.payment_preauth_hours_before) {
      skipped += 1;
      continue;
    }
    const result = await authorizeBookingPayment(booking.id);
    if (result.authorized) authorized += 1;
    else if (result.reason) failures.push(booking.id);
    else skipped += 1;
  }

  return {
    authorized,
    failures: failures.length,
    scanned: bookings?.length ?? 0,
    skipped,
  };
}

/** Cron: capture held payments whose next-day schedule has arrived. */
export async function processDueCaptures(limit = 50) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id")
    .eq("payment_status", "held")
    .not("payment_capture_scheduled_for", "is", null)
    .lte("payment_capture_scheduled_for", nowIso)
    .not("stripe_payment_intent_id", "is", null)
    .limit(limit);

  let captured = 0;
  const failures: string[] = [];

  for (const booking of bookings ?? []) {
    try {
      await captureBookingPayment(booking.id);
      captured += 1;
    } catch (error) {
      failures.push(booking.id);
      await alertAdmins(
        "payment_failed",
        "Scheduled payment capture failed",
        error instanceof Error ? error.message : "Capture failed.",
        { booking_id: booking.id },
      );
    }
  }

  return {
    captured,
    failures: failures.length,
    scanned: bookings?.length ?? 0,
  };
}

async function markPreauthFailure(
  bookingId: string,
  customerId: string,
  reason: string,
) {
  const admin = createAdminClient();
  await admin
    .from("bookings")
    .update({
      payment_preauth_failed_at: new Date().toISOString(),
      payment_preauth_failure_reason: reason,
    })
    .eq("id", bookingId);
  await notifyCustomerPaymentIssue(
    customerId,
    bookingId,
    "Payment needs attention",
    reason,
  );
}

async function notifyCustomerPaymentIssue(
  customerId: string,
  bookingId: string,
  title: string,
  body: string,
) {
  await createInAppNotification(
    customerId,
    "payment_failed",
    title,
    body,
    { booking_id: bookingId },
  );
  await sendPushNotification(customerId, title, body, {
    booking_id: bookingId,
  });
}
