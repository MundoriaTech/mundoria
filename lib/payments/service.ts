import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

import { maybeRewardReferrer } from "@/lib/customer/referrals";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { alertAdmins } from "@/lib/notifications/admin";
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
  const intent = await getStripe().paymentIntents.create(
    {
      amount,
      capture_method: "manual",
      currency: "gbp",
      customer: stripeCustomerId ?? undefined,
      metadata: {
        booking_id: bookingId ?? "",
        supabase_user_id: customerId,
      },
      setup_future_usage: "off_session",
    },
    bookingId
      ? { idempotencyKey: `manual_${bookingId}_${amount}`.slice(0, 255) }
      : undefined,
  );
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

export async function scheduleCleanerPayout(
  bookingId: string,
  charges: { visitChargeId?: string | null; waitingChargeId?: string | null } = {},
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "cleaner_id,amount_total,amount_cleaner,amount_platform,allocated_cleaners,access_penalty_pence,access_penalty_charged_at",
    )
    .eq("id", bookingId)
    .single();
  if (!booking?.cleaner_id) throw new Error("Assigned cleaner not found.");

  const { data: team } = await admin
    .from("booking_team_members")
    .select("cleaner_id,role")
    .eq("booking_id", bookingId);

  const cleanerIds = Array.from(
    new Set([
      booking.cleaner_id,
      ...((team ?? []).map((row) => row.cleaner_id as string)),
    ]),
  );
  const share = Math.floor(
    Number(booking.amount_cleaner ?? 0) / Math.max(1, cleanerIds.length),
  );
  const grossShare = Math.floor(
    Number(booking.amount_total ?? 0) / Math.max(1, cleanerIds.length),
  );
  // A collected waiting charge goes to the cleaner who waited (primary),
  // less the same platform commission the booking was priced with.
  const waiting =
    booking.access_penalty_charged_at && charges.waitingChargeId
      ? Number(booking.access_penalty_pence ?? 0)
      : 0;
  const bookingTotal = Number(booking.amount_total ?? 0);
  const commissionRate =
    bookingTotal > 0 ? Number(booking.amount_platform ?? 0) / bookingTotal : 0;
  const waitingCleanerShare = waiting - Math.round(waiting * commissionRate);

  let lastPayoutId: string | null = null;
  for (const cleanerId of cleanerIds) {
    const isPrimary = cleanerId === booking.cleaner_id;
    const extraGross = isPrimary ? waiting : 0;
    const extra = isPrimary ? waitingCleanerShare : 0;
    const { data: cleaner } = await admin
      .from("cleaner_profiles")
      .select("payout_preference")
      .eq("id", cleanerId)
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
      .eq("cleaner_id", cleanerId)
      .eq("period_start", periodStart.toISOString().slice(0, 10))
      .eq("period_end", periodEnd.toISOString().slice(0, 10))
      .eq("status", "pending")
      .maybeSingle();
    let payoutId: string;
    if (existing) {
      await admin
        .from("payouts")
        .update({
          gross_amount: Number(existing.gross_amount) + grossShare + extraGross,
          net_amount: Number(existing.net_amount) + share + extra,
          total_jobs: existing.total_jobs + 1,
        })
        .eq("id", existing.id);
      payoutId = existing.id as string;
    } else {
      const { data: payout, error } = await admin
        .from("payouts")
        .insert({
          cleaner_id: cleanerId,
          gross_amount: grossShare + extraGross,
          net_amount: share + extra,
          period_end: periodEnd.toISOString().slice(0, 10),
          period_start: periodStart.toISOString().slice(0, 10),
          status: "pending",
          total_jobs: 1,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      payoutId = payout.id as string;
    }
    // Record which charge pays for this, so the transfer can name it as its
    // source (Stripe sends it once that charge's funds are available).
    const items = [
      {
        amount: share,
        booking_id: bookingId,
        cleaner_id: cleanerId,
        kind: "visit",
        payout_id: payoutId,
        stripe_charge_id: charges.visitChargeId ?? null,
      },
      ...(extra > 0
        ? [
            {
              amount: extra,
              booking_id: bookingId,
              cleaner_id: cleanerId,
              kind: "waiting_charge",
              payout_id: payoutId,
              stripe_charge_id: charges.waitingChargeId ?? null,
            },
          ]
        : []),
    ];
    await admin
      .from("payout_items")
      .upsert(items, { onConflict: "payout_id,booking_id,kind" });
    lastPayoutId = payoutId;
  }
  return lastPayoutId;
}

/** Charge the saved card off-session (no hold) for a set amount. */
async function chargeSavedCard({
  amount,
  bookingId,
  customerId,
  kind,
  paymentMethodId,
}: {
  amount: number;
  bookingId: string;
  customerId: string;
  kind: "visit" | "waiting_charge";
  paymentMethodId: string | null;
}) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", customerId)
    .single();
  if (!paymentMethodId || !profile?.stripe_customer_id) {
    throw new Error("No saved card to charge.");
  }
  const intent = await getStripe().paymentIntents.create(
    {
      amount,
      confirm: true,
      currency: "gbp",
      customer: profile.stripe_customer_id,
      description:
        kind === "waiting_charge"
          ? "Mundoria waiting charge"
          : "Mundoria cleaning visit",
      metadata: { booking_id: bookingId, kind, supabase_user_id: customerId },
      off_session: true,
      payment_method: paymentMethodId,
    },
    { idempotencyKey: `charge_${kind}_${bookingId}_${amount}`.slice(0, 255) },
  );
  if (intent.status !== "succeeded") {
    throw new Error(`Charge ended in status ${intent.status}.`);
  }
  return intent;
}

function chargeIdOf(intent: { latest_charge?: unknown }) {
  const charge = intent.latest_charge;
  if (!charge) return null;
  return typeof charge === "string" ? charge : (charge as { id: string }).id;
}

export async function captureBookingPayment(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "stripe_payment_intent_id,payment_status,amount_total,customer_id,stripe_payment_method_id,access_penalty_pence,access_penalty_payment_intent_id",
    )
    .eq("id", bookingId)
    .single();
  if (!booking?.stripe_payment_intent_id) {
    throw new Error("Booking has no PaymentIntent.");
  }
  const stripe = getStripe();
  let intent = await stripe.paymentIntents.retrieve(
    booking.stripe_payment_intent_id,
  );
  if (intent.status === "requires_capture") {
    intent = await stripe.paymentIntents.capture(intent.id);
  } else if (intent.status === "canceled") {
    // The hold lapsed (card holds last about 7 days, e.g. while a dispute
    // was open). Charge the saved card directly instead.
    intent = await chargeSavedCard({
      amount: Number(booking.amount_total ?? 0),
      bookingId,
      customerId: booking.customer_id,
      kind: "visit",
      paymentMethodId: booking.stripe_payment_method_id,
    });
  } else if (intent.status !== "succeeded") {
    throw new Error(`PaymentIntent cannot be captured from ${intent.status}.`);
  }
  await admin
    .from("bookings")
    .update({
      payment_capture_failed_at: null,
      payment_capture_failure_reason: null,
      payment_capture_scheduled_for: null,
      payment_captured_at: new Date().toISOString(),
      payment_status: "released",
      stripe_payment_intent_id: intent.id,
    })
    .eq("id", bookingId);

  // Waiting charge: its own payment, so the main hold amount never changes.
  let waitingChargeId: string | null = null;
  const penalty = Number(booking.access_penalty_pence ?? 0);
  if (penalty > 0 && !booking.access_penalty_payment_intent_id) {
    try {
      const waiting = await chargeSavedCard({
        amount: penalty,
        bookingId,
        customerId: booking.customer_id,
        kind: "waiting_charge",
        paymentMethodId: booking.stripe_payment_method_id,
      });
      waitingChargeId = chargeIdOf(waiting);
      await admin
        .from("bookings")
        .update({
          access_penalty_charged_at: new Date().toISOString(),
          access_penalty_payment_intent_id: waiting.id,
        })
        .eq("id", bookingId);
    } catch (error) {
      await alertAdmins(
        "payment_failed",
        "A waiting charge could not be taken",
        `The visit was paid, but the separate waiting charge of £${(penalty / 100).toFixed(2)} failed. ${error instanceof Error ? error.message : ""}`.trim(),
        { booking_id: bookingId },
      );
    }
  }

  let payoutId: string | null = null;
  try {
    payoutId = await scheduleCleanerPayout(bookingId, {
      visitChargeId: chargeIdOf(intent),
      waitingChargeId,
    });
  } catch (error) {
    await alertAdmins(
      "payout_failed",
      "A cleaner could not be paid",
      error instanceof Error
        ? `We could not set up this cleaner’s payout. ${error.message}`
        : "We could not set up this cleaner’s payout.",
      { booking_id: bookingId },
    );
  }
  try {
    await maybeRewardReferrer(bookingId);
  } catch {
    // Referral rewards should not block payment capture.
  }
  await sendRatingRequest(bookingId).catch(() => undefined);
  return { intentId: intent.id, payoutId };
}

/** The day after the clean (at capture): ask the customer to rate it. */
async function sendRatingRequest(bookingId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select(
      "scheduled_date,scheduled_start_time,service_type,customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
    )
    .eq("id", bookingId)
    .single();
  const customer = (Array.isArray(data?.customer) ? data?.customer[0] : data?.customer) as
    | { email?: string | null; full_name?: string | null; notification_preferences?: { email?: boolean } | null }
    | null
    | undefined;
  if (!customer?.email || customer.notification_preferences?.email === false) return;
  const { count } = await admin
    .from("ratings")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId);
  if (count) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await sendBrandedEmail({
    data: {
      appUrl,
      bookingId,
      bookingUrl: `${appUrl}/booking/${bookingId}`,
      firstName: customer.full_name?.split(" ")[0],
      scheduledDate: data?.scheduled_date,
      scheduledTime: String(data?.scheduled_start_time ?? "").slice(0, 5),
      serviceName: String(data?.service_type ?? "").replaceAll("_", " "),
    },
    template: "customer.rating_request",
    to: customer.email,
  });
}

export async function refundBookingPayment(
  bookingId: string,
  amount?: number,
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "stripe_payment_intent_id,customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
    )
    .eq("id", bookingId)
    .single();
  if (!booking?.stripe_payment_intent_id) {
    throw new Error("Booking has no PaymentIntent.");
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(
    booking.stripe_payment_intent_id,
  );
  let refundedPence = 0;
  if (intent.status === "succeeded") {
    const refund = await stripe.refunds.create({
      amount,
      payment_intent: intent.id,
      reason: "requested_by_customer",
    });
    refundedPence = refund.amount;
  } else if (!["canceled", "requires_payment_method"].includes(intent.status)) {
    // An uncaptured hold is released, not refunded: nothing was charged.
    await stripe.paymentIntents.cancel(intent.id);
  }
  await admin
    .from("bookings")
    .update({ payment_status: "refunded", payment_capture_scheduled_for: null })
    .eq("id", bookingId);

  // Money actually came back to the card: tell the customer.
  const customer = (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) as
    | { email?: string | null; full_name?: string | null; notification_preferences?: { email?: boolean } | null }
    | null
    | undefined;
  if (refundedPence > 0 && customer?.email && customer.notification_preferences?.email !== false) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendBrandedEmail({
      data: {
        amount: `£${(refundedPence / 100).toFixed(2)}`,
        appUrl,
        bookingId,
        bookingUrl: `${appUrl}/booking/${bookingId}`,
        firstName: customer.full_name?.split(" ")[0],
      },
      template: "customer.refund_issued",
      to: customer.email,
    }).catch(() => undefined);
  }
  return intent.id;
}

export async function processCleanerPayout(payoutId: string) {
  const admin = createAdminClient();
  const { data: payout } = await admin
    .from("payouts")
    .select("*,profile:profiles!payouts_cleaner_id_fkey(stripe_account_id,email,full_name)")
    .eq("id", payoutId)
    .single();
  if (!payout?.profile?.stripe_account_id) {
    throw new Error("Cleaner Stripe account is missing.");
  }
  const stripe = getStripe();
  const destination = payout.profile.stripe_account_id as string;
  const { data: items } = await admin
    .from("payout_items")
    .select("id,amount,stripe_charge_id,stripe_transfer_id")
    .eq("payout_id", payout.id)
    .order("created_at");

  // Pay each booking's share from its own charge (source_transaction), so
  // the transfer waits for that charge's funds instead of failing on the
  // available balance. Deductions (net below gross) shrink what is sent.
  let remaining = Number(payout.net_amount);
  for (const item of items ?? []) {
    if (item.stripe_transfer_id) {
      remaining -= Number(item.amount);
      continue;
    }
  }
  const transferIds: string[] = (items ?? [])
    .map((item) => item.stripe_transfer_id as string | null)
    .filter((id): id is string => Boolean(id));
  for (const item of items ?? []) {
    if (item.stripe_transfer_id || remaining <= 0) continue;
    const amount = Math.min(Number(item.amount), remaining);
    if (amount <= 0) continue;
    const transfer = await stripe.transfers.create(
      {
        amount,
        currency: "gbp",
        destination,
        metadata: { payout_id: payout.id, payout_item_id: item.id },
        ...(item.stripe_charge_id ? { source_transaction: item.stripe_charge_id } : {}),
        transfer_group: `payout_${payout.id}`,
      },
      { idempotencyKey: `payout_item_${item.id}_${amount}` },
    );
    await admin
      .from("payout_items")
      .update({ stripe_transfer_id: transfer.id, transferred_at: new Date().toISOString() })
      .eq("id", item.id);
    transferIds.push(transfer.id);
    remaining -= amount;
  }
  // Anything not covered by recorded items (payouts from before items
  // existed) goes as one plain transfer, as before.
  if (remaining > 0) {
    const transfer = await stripe.transfers.create(
      {
        amount: remaining,
        currency: "gbp",
        destination,
        metadata: { payout_id: payout.id },
        transfer_group: `payout_${payout.id}`,
      },
      { idempotencyKey: `payout_rest_${payout.id}_${remaining}` },
    );
    transferIds.push(transfer.id);
  }
  await admin
    .from("payouts")
    .update({
      processed_at: new Date().toISOString(),
      status: "paid",
      stripe_transfer_id: transferIds[0] ?? null,
    })
    .eq("id", payout.id);

  const email = payout.profile.email as string | null;
  if (email) {
    await sendBrandedEmail({
      data: {
        amount: `£${(Number(payout.net_amount) / 100).toFixed(2)}`,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
        firstName: (payout.profile.full_name as string | null)?.split(" ")[0],
        period: `${payout.period_start} to ${payout.period_end}`,
        transferId: transferIds[0],
      },
      template: "cleaner.payout_completed",
      to: email,
    }).catch(() => undefined);
  }
  return { id: transferIds[0] ?? "" };
}

export function payoutDueDate(preference: "weekly" | "monthly") {
  const now = new Date();
  return preference === "weekly"
    ? addDays(endOfWeek(now, { weekStartsOn: 1 }), 1)
    : addDays(endOfMonth(now), 1);
}
