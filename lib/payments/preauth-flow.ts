import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  authorizeBookingPayment,
  getPaymentTimingSettings,
  type PaymentTimingSettings,
} from "@/lib/payments/lifecycle";
import {
  bookingStartUtc,
  londonDateParts,
  londonLocalToUtc,
  PAYMENT_TIME_ZONE,
} from "@/lib/payments/uk-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertZohoContact } from "@/lib/zoho/crm";
import { getStripe } from "@/lib/stripe/server";

/** Free-cancel / payment-fail deadline before the visit (policy). */
export const PAYMENT_CANCEL_HOURS_BEFORE = 24;
/** Leave ~30 minutes before the deadline for the final attempt. */
const FINAL_ATTEMPT_BUFFER_MS = 30 * 60 * 1000;
const QUIET_START_HOUR_UK = 22;
const QUIET_END_HOUR_UK = 8;
const DEFAULT_MAX_ATTEMPTS = 5;

const AUTH_FAIL_CANCEL_REASON =
  "We could not secure the cleaning payment before the 24-hour confirmation deadline, so this booking was cancelled free of charge. Update your card and book again when you are ready.";

export type AuthAttemptResult = {
  authorized: boolean;
  attemptNumber?: number;
  cancelled?: boolean;
  deferred?: boolean;
  reason?: string;
  requiresAction?: boolean;
  scheduledNextAt?: string | null;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function computeAuthWindow(input: {
  openHoursBefore: number;
  scheduledDate: string;
  scheduledStartTime: string;
  cancelHoursBefore?: number;
}) {
  const start = bookingStartUtc(input.scheduledDate, input.scheduledStartTime);
  if (!start) return null;
  const cancelHours = input.cancelHoursBefore ?? PAYMENT_CANCEL_HOURS_BEFORE;
  const openHours = Math.max(input.openHoursBefore, cancelHours);
  return {
    deadlineAt: new Date(start.getTime() - cancelHours * 60 * 60 * 1000),
    openAt: new Date(start.getTime() - openHours * 60 * 60 * 1000),
    start,
  };
}

/** Spread up to `maxAttempts` times from firstAttempt through deadline−30m. */
export function computeRetrySchedule(
  firstAttemptAt: Date,
  deadlineAt: Date,
  maxAttempts: number,
): Date[] {
  const count = Math.max(1, Math.min(10, Math.floor(maxAttempts)));
  const end = new Date(deadlineAt.getTime() - FINAL_ATTEMPT_BUFFER_MS);
  if (end.getTime() <= firstAttemptAt.getTime()) {
    return [firstAttemptAt];
  }
  if (count === 1) return [firstAttemptAt];
  const span = end.getTime() - firstAttemptAt.getTime();
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return new Date(firstAttemptAt.getTime() + span * ratio);
  });
}

export function isRetryableAuthFailure(input: {
  declineCode?: string | null;
  message?: string | null;
  requiresAction?: boolean;
}) {
  if (input.requiresAction) return false;
  const code = (input.declineCode ?? "").toLowerCase();
  const message = (input.message ?? "").toLowerCase();
  const hard = [
    "lost_card",
    "stolen_card",
    "pickup_card",
    "restricted_card",
    "card_not_supported",
    "currency_not_supported",
    "do_not_try_again",
    "stop_payment_order",
    "revocation_of_authorization",
    "revocation_of_all_authorizations",
    "transaction_not_allowed",
    "invalid_account",
    "incorrect_number",
    "invalid_number",
    "expired_card",
    "authentication_required",
  ];
  if (hard.includes(code)) return false;
  if (
    message.includes("authentication") ||
    message.includes("requires_action") ||
    message.includes("extra confirmation") ||
    message.includes("do not try again") ||
    message.includes("do_not_try_again")
  ) {
    return false;
  }
  // Soft / unknown → allow another attempt within the window.
  return true;
}

function londonHour(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: PAYMENT_TIME_ZONE,
    }).format(date),
  );
  return hour;
}

/** True during UK quiet hours (22:00–08:00) for customer notifications. */
export function isQuietHoursUk(date = new Date()) {
  const hour = londonHour(date);
  return hour >= QUIET_START_HOUR_UK || hour < QUIET_END_HOUR_UK;
}

function nextQuietExitUk(from = new Date()) {
  const parts = londonDateParts(from);
  const hour = londonHour(from);
  if (hour >= QUIET_END_HOUR_UK && hour < QUIET_START_HOUR_UK) {
    return from;
  }
  // After 22:00 → next calendar day 08:00. Before 08:00 → today 08:00.
  if (hour >= QUIET_START_HOUR_UK) {
    const next = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day + 1),
    );
    return londonLocalToUtc(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
      QUIET_END_HOUR_UK,
      0,
    );
  }
  return londonLocalToUtc(
    parts.year,
    parts.month,
    parts.day,
    QUIET_END_HOUR_UK,
    0,
  );
}

async function loadTiming(): Promise<PaymentTimingSettings> {
  return getPaymentTimingSettings();
}

async function recordAttempt(input: {
  attemptNumber: number;
  bookingId: string;
  declineCode?: string | null;
  errorMessage?: string | null;
  intentId?: string | null;
  outcome: "succeeded" | "failed" | "skipped" | "scheduled" | "cancelled";
  retryable?: boolean | null;
  scheduledFor?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("booking_payment_auth_attempts").upsert(
    {
      attempted_at:
        input.outcome === "scheduled" ? null : new Date().toISOString(),
      attempt_number: input.attemptNumber,
      booking_id: input.bookingId,
      error_message: input.errorMessage ?? null,
      outcome: input.outcome,
      retryable: input.retryable ?? null,
      scheduled_for: input.scheduledFor ?? null,
      stripe_decline_code: input.declineCode ?? null,
      stripe_payment_intent_id: input.intentId ?? null,
    },
    { onConflict: "booking_id,attempt_number" },
  );
}

/**
 * After a cleaner accepts: mark awaiting_payment, stamp the auth window,
 * and either authorize now or schedule the first attempt.
 */
export async function onCleanerAcceptedForPayment(
  bookingId: string,
): Promise<AuthAttemptResult> {
  const admin = createAdminClient();
  const settings = await loadTiming();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,cleaner_id,status,payment_status,scheduled_date,scheduled_start_time,stripe_payment_method_id,payment_auth_max_attempts,amount_total",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { authorized: false, reason: "Booking not found." };
  if (!booking.cleaner_id) {
    return { authorized: false, reason: "No cleaner assigned." };
  }
  if (booking.payment_status === "held" || booking.payment_status === "released") {
    await promoteToConfirmed(bookingId);
    return { authorized: true };
  }
  if (booking.payment_status !== "unpaid") {
    return { authorized: false, reason: "Payment already settled." };
  }

  const window = computeAuthWindow({
    openHoursBefore: settings.payment_auth_open_hours_before,
    scheduledDate: booking.scheduled_date,
    scheduledStartTime: String(booking.scheduled_start_time),
    cancelHoursBefore: settings.payment_preauth_hours_before,
  });
  if (!window) {
    return { authorized: false, reason: "Invalid schedule." };
  }

  const maxAttempts = booking.payment_auth_max_attempts || DEFAULT_MAX_ATTEMPTS;
  const now = Date.now();

  await admin
    .from("bookings")
    .update({
      payment_auth_attempt_count: 0,
      payment_auth_deadline_at: window.deadlineAt.toISOString(),
      payment_auth_max_attempts: maxAttempts,
      payment_auth_next_attempt_at: null,
      payment_auth_stop_retries: false,
      payment_auth_window_opens_at: window.openAt.toISOString(),
      payment_preauth_failed_at: null,
      payment_preauth_failure_reason: null,
      status: "awaiting_payment",
    })
    .eq("id", bookingId)
    .in("status", ["pending_match", "matched", "awaiting_payment", "confirmed"]);

  // Last-minute (already inside free-cancel window): one immediate attempt.
  if (now >= window.deadlineAt.getTime()) {
    return runAuthorizationAttempt(bookingId, { force: true, lastChance: true });
  }

  // Outside the auth-open window: schedule first attempt when the window opens.
  if (now < window.openAt.getTime()) {
    const schedule = computeRetrySchedule(
      window.openAt,
      window.deadlineAt,
      maxAttempts,
    );
    const next = schedule[0] ?? window.openAt;
    await admin
      .from("bookings")
      .update({
        payment_auth_next_attempt_at: next.toISOString(),
      })
      .eq("id", bookingId);
    await recordAttempt({
      attemptNumber: 1,
      bookingId,
      outcome: "scheduled",
      scheduledFor: next.toISOString(),
    });
    await notifyCleanerPendingPayment(booking.cleaner_id, bookingId);
    return {
      authorized: false,
      deferred: true,
      reason: `Payment hold opens ${settings.payment_auth_open_hours_before}h before the visit.`,
      scheduledNextAt: next.toISOString(),
    };
  }

  // Inside the open window: attempt immediately.
  return runAuthorizationAttempt(bookingId, { force: true });
}

/**
 * Execute the next auth attempt (or a forced immediate retry after card update).
 */
export async function runAuthorizationAttempt(
  bookingId: string,
  options?: { force?: boolean; lastChance?: boolean },
): Promise<AuthAttemptResult> {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,cleaner_id,status,payment_status,scheduled_date,scheduled_start_time,stripe_payment_method_id,payment_auth_attempt_count,payment_auth_max_attempts,payment_auth_next_attempt_at,payment_auth_window_opens_at,payment_auth_deadline_at,payment_auth_stop_retries,payment_auth_last_notified_at,amount_total",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { authorized: false, reason: "Booking not found." };
  if (booking.status === "cancelled") {
    return { authorized: false, reason: "Booking cancelled." };
  }
  if (booking.payment_status === "held" || booking.payment_status === "released") {
    if (booking.status === "awaiting_payment") {
      await promoteToConfirmed(bookingId);
    }
    return { authorized: true };
  }
  if (booking.payment_status !== "unpaid") {
    return { authorized: false, reason: "Payment already settled." };
  }
  if (!booking.cleaner_id) {
    return { authorized: false, reason: "No cleaner assigned." };
  }
  if (
    booking.status !== "awaiting_payment" &&
    booking.status !== "confirmed" &&
    booking.status !== "cleaner_en_route" &&
    booking.status !== "in_progress"
  ) {
    return { authorized: false, reason: "Booking is not awaiting payment." };
  }

  const now = Date.now();
  const deadlineAt = booking.payment_auth_deadline_at
    ? new Date(booking.payment_auth_deadline_at)
    : null;
  const openAt = booking.payment_auth_window_opens_at
    ? new Date(booking.payment_auth_window_opens_at)
    : null;
  const maxAttempts = booking.payment_auth_max_attempts || DEFAULT_MAX_ATTEMPTS;
  const attemptCount = booking.payment_auth_attempt_count || 0;

  if (!options?.force && booking.payment_auth_stop_retries) {
    return { authorized: false, reason: "Automatic retries stopped." };
  }
  if (!options?.force && openAt && now < openAt.getTime()) {
    return {
      authorized: false,
      deferred: true,
      reason: "Auth window not open yet.",
      scheduledNextAt: openAt.toISOString(),
    };
  }
  if (
    !options?.force &&
    booking.payment_auth_next_attempt_at &&
    now < new Date(booking.payment_auth_next_attempt_at).getTime() - 15_000
  ) {
    return {
      authorized: false,
      deferred: true,
      reason: "Next attempt not due yet.",
      scheduledNextAt: booking.payment_auth_next_attempt_at,
    };
  }
  if (attemptCount >= maxAttempts && !options?.force) {
    return cancelUnpaidAwaitingPayment(bookingId, AUTH_FAIL_CANCEL_REASON);
  }

  const attemptNumber = attemptCount + 1;
  const result = await authorizeBookingPayment(bookingId, {
    attemptNumber,
    allowAwaitingPayment: true,
  });

  if (result.authorized) {
    await admin
      .from("bookings")
      .update({
        payment_auth_attempt_count: attemptNumber,
        payment_auth_next_attempt_at: null,
        payment_auth_stop_retries: true,
        payment_preauth_failed_at: null,
        payment_preauth_failure_reason: null,
      })
      .eq("id", bookingId);
    await recordAttempt({
      attemptNumber,
      bookingId,
      intentId: result.intentId ?? null,
      outcome: "succeeded",
      retryable: false,
    });
    if (booking.status === "awaiting_payment") {
      await promoteToConfirmed(bookingId);
    }
    return { authorized: true, attemptNumber };
  }

  const retryable =
    !options?.lastChance &&
    isRetryableAuthFailure({
      declineCode: result.declineCode,
      message: result.reason,
      requiresAction: result.requiresAction,
    });

  await recordAttempt({
    attemptNumber,
    bookingId,
    declineCode: result.declineCode ?? null,
    errorMessage: result.reason ?? null,
    intentId: result.intentId ?? null,
    outcome: "failed",
    retryable,
  });

  const remaining = maxAttempts - attemptNumber;
  const pastDeadline = deadlineAt != null && now >= deadlineAt.getTime();

  if (
    options?.lastChance ||
    pastDeadline ||
    !retryable ||
    remaining <= 0 ||
    !deadlineAt
  ) {
    await admin
      .from("bookings")
      .update({
        payment_auth_attempt_count: attemptNumber,
        payment_auth_next_attempt_at: null,
        payment_auth_stop_retries: true,
        payment_preauth_failed_at: new Date().toISOString(),
        payment_preauth_failure_reason: result.reason ?? "Authorization failed",
      })
      .eq("id", bookingId);

    if (booking.status === "awaiting_payment" || pastDeadline || options?.lastChance) {
      return cancelUnpaidAwaitingPayment(
        bookingId,
        result.requiresAction
          ? "Your bank needs extra confirmation before we can hold the payment. This booking was cancelled free of charge — update your card and book again."
          : AUTH_FAIL_CANCEL_REASON,
      );
    }

    return {
      authorized: false,
      attemptNumber,
      reason: result.reason,
      requiresAction: result.requiresAction,
    };
  }

  // Schedule remaining attempts evenly until deadline − 30m.
  const firstNext = new Date(Math.max(now + 5 * 60 * 1000, now));
  const remainingSchedule = computeRetrySchedule(
    firstNext,
    deadlineAt,
    remaining + 1,
  );
  // First slot is "now" (already attempted); use the rest.
  const nextAt = remainingSchedule[1] ?? remainingSchedule[0] ?? firstNext;

  await admin
    .from("bookings")
    .update({
      payment_auth_attempt_count: attemptNumber,
      payment_auth_next_attempt_at: nextAt.toISOString(),
      payment_auth_stop_retries: false,
      payment_preauth_failed_at: new Date().toISOString(),
      payment_preauth_failure_reason: result.reason ?? "Authorization failed",
    })
    .eq("id", bookingId);

  for (let index = 0; index < remaining; index += 1) {
    const scheduled = remainingSchedule[index + 1] ?? nextAt;
    await recordAttempt({
      attemptNumber: attemptNumber + 1 + index,
      bookingId,
      outcome: "scheduled",
      scheduledFor: scheduled.toISOString(),
    });
  }

  await notifyCustomerAuthFailure({
    bookingId,
    customerId: booking.customer_id,
    nextAttemptAt: nextAt,
    reason: result.reason ?? "Authorization failed",
    remainingAttempts: remaining,
    requiresAction: Boolean(result.requiresAction),
    schedule: remainingSchedule.slice(1),
  });

  if (booking.cleaner_id) {
    await notifyCleanerPendingPayment(booking.cleaner_id, bookingId);
  }

  return {
    authorized: false,
    attemptNumber,
    reason: result.reason,
    requiresAction: result.requiresAction,
    scheduledNextAt: nextAt.toISOString(),
  };
}

/** Customer updated their card — clear stop flag and retry immediately. */
export async function retryAuthAfterCardUpdate(
  bookingId: string,
): Promise<AuthAttemptResult> {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,status,payment_status,payment_auth_stop_retries")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { authorized: false, reason: "Booking not found." };
  if (booking.payment_status !== "unpaid") {
    return { authorized: booking.payment_status === "held" };
  }
  if (booking.status !== "awaiting_payment") {
    return { authorized: false, reason: "Booking is not awaiting payment." };
  }

  await admin
    .from("bookings")
    .update({
      payment_auth_next_attempt_at: new Date().toISOString(),
      payment_auth_stop_retries: false,
      payment_preauth_failed_at: null,
      payment_preauth_failure_reason: null,
    })
    .eq("id", bookingId);

  return runAuthorizationAttempt(bookingId, { force: true });
}

/** Cron: run due retries and open-window first attempts. */
export async function processDuePaymentAuthAttempts(limit = 50) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: due } = await admin
    .from("bookings")
    .select("id")
    .eq("status", "awaiting_payment")
    .eq("payment_status", "unpaid")
    .eq("payment_auth_stop_retries", false)
    .not("cleaner_id", "is", null)
    .not("stripe_payment_method_id", "is", null)
    .lte("payment_auth_next_attempt_at", nowIso)
    .order("payment_auth_next_attempt_at", { ascending: true })
    .limit(limit);

  let authorized = 0;
  let failed = 0;
  for (const row of due ?? []) {
    const result = await runAuthorizationAttempt(row.id);
    if (result.authorized) authorized += 1;
    else failed += 1;
  }

  return {
    authorized,
    failed,
    scanned: due?.length ?? 0,
  };
}

/** Cron: cancel unpaid awaiting_payment bookings past the T−24h deadline. */
export async function processPaymentAuthDeadlines(limit = 50) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: due } = await admin
    .from("bookings")
    .select("id")
    .eq("status", "awaiting_payment")
    .eq("payment_status", "unpaid")
    .not("payment_auth_deadline_at", "is", null)
    .lte("payment_auth_deadline_at", nowIso)
    .limit(limit);

  let cancelled = 0;
  for (const row of due ?? []) {
    const result = await cancelUnpaidAwaitingPayment(
      row.id,
      AUTH_FAIL_CANCEL_REASON,
    );
    if (result.cancelled) cancelled += 1;
  }
  return { cancelled, scanned: due?.length ?? 0 };
}

async function promoteToConfirmed(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "awaiting_payment")
    .select(
      "id,customer_id,cleaner_id,scheduled_date,scheduled_start_time,service_type,customer:profiles!bookings_customer_id_fkey(email,full_name),cleaner:profiles!bookings_cleaner_id_fkey(email,full_name)",
    )
    .maybeSingle();

  if (!booking) {
    // Already confirmed or race — ensure status if held.
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId)
      .in("status", ["awaiting_payment", "matched"]);
    return;
  }

  const url = appUrl();
  const customer = Array.isArray(booking.customer)
    ? booking.customer[0]
    : booking.customer;
  const cleaner = Array.isArray(booking.cleaner)
    ? booking.cleaner[0]
    : booking.cleaner;

  if (booking.customer_id) {
    await createInAppNotification(
      booking.customer_id,
      "booking_confirmed",
      "Booking confirmed",
      "Payment is secured and your cleaner is confirmed.",
      { booking_id: bookingId },
    );
    await sendPushNotification(
      booking.customer_id,
      "Booking confirmed",
      "Payment is secured and your cleaner is confirmed.",
      { booking_id: bookingId },
    );
    if (customer?.email) {
      await sendBrandedEmail({
        data: {
          appUrl: url,
          bookingId,
          bookingUrl: `${url}/booking/${bookingId}`,
          scheduledDate: booking.scheduled_date,
          scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
        },
        template: "customer.booking_confirmed",
        to: customer.email,
      }).catch(() => undefined);
    }
    try {
      await upsertZohoContact(
        {
          email: customer?.email ?? "",
          fullName: customer?.full_name ?? "Mundoria customer",
          userId: booking.customer_id,
        },
        { lastBookingDate: booking.scheduled_date },
      );
    } catch {
      // CRM must never block confirmation.
    }
  }

  if (booking.cleaner_id) {
    await createInAppNotification(
      booking.cleaner_id,
      "job_confirmed",
      "Job confirmed",
      "Payment is secured. This visit is confirmed.",
      { booking_id: bookingId },
    );
    await sendPushNotification(
      booking.cleaner_id,
      "Job confirmed",
      "Payment is secured. This visit is confirmed.",
      { booking_id: bookingId },
    );
    if (cleaner?.email) {
      await sendBrandedEmail({
        data: {
          appUrl: url,
          bookingId,
          jobUrl: `${url}/cleaner/jobs/${bookingId}`,
          scheduledDate: booking.scheduled_date,
          scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
        },
        template: "cleaner.job_accepted",
        to: cleaner.email,
      }).catch(() => undefined);
    }
  }
}

export async function cancelUnpaidAwaitingPayment(
  bookingId: string,
  reason: string,
): Promise<AuthAttemptResult> {
  const admin = createAdminClient();
  const failedAt = new Date().toISOString();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,status,cleaner_id,customer_id,payment_status,scheduled_date,scheduled_start_time,stripe_payment_intent_id,cancelled_at,customer:profiles!bookings_customer_id_fkey(email,full_name)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.cancelled_at || booking.status === "cancelled") {
    return { authorized: false, cancelled: false, reason: "Already cancelled." };
  }
  if (booking.payment_status === "held" || booking.payment_status === "released") {
    return { authorized: true, cancelled: false };
  }

  const cleanerId = booking.cleaner_id as string | null;
  await admin
    .from("bookings")
    .update({
      cancellation_reason: reason,
      cancelled_at: failedAt,
      cancelled_by: null,
      cleaner_id: null,
      payment_auth_next_attempt_at: null,
      payment_auth_stop_retries: true,
      payment_preauth_failed_at: failedAt,
      payment_preauth_failure_reason: reason,
      status: "cancelled",
    })
    .eq("id", bookingId)
    .neq("status", "cancelled");

  if (booking.stripe_payment_intent_id) {
    try {
      await getStripe().paymentIntents.cancel(booking.stripe_payment_intent_id);
    } catch {
      // Already cancelled / not cancellable.
    }
  }

  await admin
    .from("cleaner_job_responses")
    .update({
      expires_at: failedAt,
      response: "expired",
      responded_at: failedAt,
    })
    .eq("booking_id", bookingId)
    .is("responded_at", null);

  const customer = Array.isArray(booking.customer)
    ? booking.customer[0]
    : booking.customer;
  const url = appUrl();

  if (booking.customer_id) {
    await createInAppNotification(
      booking.customer_id,
      "payment_failed",
      "Booking cancelled — payment not secured",
      reason,
      { booking_id: bookingId },
    );
    await sendPushNotification(
      booking.customer_id,
      "Booking cancelled — payment not secured",
      reason,
      { booking_id: bookingId },
    );
    if (customer?.email) {
      await sendBrandedEmail({
        data: {
          appUrl: url,
          bookingId,
          bookingUrl: `${url}/booking/${bookingId}`,
          reason,
          scheduledDate: booking.scheduled_date,
          scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
        },
        template: "customer.booking_cancelled",
        to: customer.email,
      }).catch(() => undefined);
    }
    try {
      await upsertZohoContact(
        {
          email: customer?.email ?? "",
          fullName: customer?.full_name ?? "Mundoria customer",
          userId: booking.customer_id,
        },
        { lastBookingDate: booking.scheduled_date },
      );
    } catch {
      // ignore
    }
  }

  if (cleanerId) {
    await createInAppNotification(
      cleanerId,
      "job_cancelled",
      "Job cancelled",
      "This visit was cancelled because the customer payment could not be secured. No charge was taken.",
      { booking_id: bookingId },
    );
    await sendPushNotification(
      cleanerId,
      "Job cancelled",
      "Customer payment could not be secured. The visit was cancelled free of charge.",
      { booking_id: bookingId },
    );
  }

  await alertAdmins(
    "payment_failed",
    "Booking cancelled after payment authorisation window",
    reason,
    { booking_id: bookingId },
  );

  return { authorized: false, cancelled: true, reason };
}

async function notifyCleanerPendingPayment(cleanerId: string, bookingId: string) {
  await createInAppNotification(
    cleanerId,
    "job_pending_payment",
    "Accepted — confirming payment",
    "Thanks for accepting. We’re securing the customer payment before this visit is fully confirmed.",
    { booking_id: bookingId },
  );
}

async function notifyCustomerAuthFailure(input: {
  bookingId: string;
  customerId: string;
  nextAttemptAt: Date;
  reason: string;
  remainingAttempts: number;
  requiresAction: boolean;
  schedule: Date[];
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("payment_auth_last_notified_at,scheduled_date,scheduled_start_time")
    .eq("id", input.bookingId)
    .maybeSingle();

  const last = booking?.payment_auth_last_notified_at
    ? new Date(booking.payment_auth_last_notified_at).getTime()
    : 0;
  // Avoid noisy repeats within 3 hours.
  if (Date.now() - last < 3 * 60 * 60 * 1000) return;

  const sendAt = isQuietHoursUk() ? nextQuietExitUk() : new Date();
  // If quiet hours, skip push/email until morning unless SCA requires action.
  if (isQuietHoursUk() && !input.requiresAction) {
    await admin
      .from("bookings")
      .update({ payment_auth_last_notified_at: sendAt.toISOString() })
      .eq("id", input.bookingId);
    // Still leave in-app note.
  }

  const times = input.schedule
    .slice(0, 4)
    .map((date) =>
      date.toLocaleString("en-GB", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        timeZone: PAYMENT_TIME_ZONE,
        weekday: "short",
      }),
    )
    .join("; ");

  const body = input.requiresAction
    ? "Your bank needs you to confirm this payment. Update your card or complete verification so we can confirm your cleaner."
    : `We couldn’t secure the cleaning payment yet. ${input.remainingAttempts} more attempt${input.remainingAttempts === 1 ? "" : "s"} scheduled${times ? ` (${times})` : ""}. Update your card anytime to retry immediately.`;

  await createInAppNotification(
    input.customerId,
    "payment_failed",
    "Payment needs attention",
    body,
    { booking_id: input.bookingId },
  );

  if (!isQuietHoursUk() || input.requiresAction) {
    await sendPushNotification(
      input.customerId,
      "Payment needs attention",
      body,
      { booking_id: input.bookingId },
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", input.customerId)
      .maybeSingle();
    if (profile?.email) {
      await sendBrandedEmail({
        data: {
          appUrl: appUrl(),
          bookingId: input.bookingId,
          bookingUrl: `${appUrl()}/booking/${input.bookingId}`,
          reason: body,
          scheduledDate: booking?.scheduled_date,
          scheduledTime: String(booking?.scheduled_start_time ?? "").slice(0, 5),
        },
        template: "customer.booking_cancelled",
        to: profile.email,
      }).catch(() => undefined);
    }
    await admin
      .from("bookings")
      .update({ payment_auth_last_notified_at: new Date().toISOString() })
      .eq("id", input.bookingId);
  }
}
