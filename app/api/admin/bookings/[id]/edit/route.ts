import { NextResponse } from "next/server";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  bookingEditSchema,
  EDIT_BOOKING_SELECT,
  planBookingEdit,
  type BookingChange,
  type EditableBooking,
} from "@/lib/admin/booking-edit";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { offerAdminAssignedJob } from "@/lib/matching/admin-offer";
import { notifyCleanerDayOf } from "@/lib/notifications/cleaner-day-of";
import { createInAppNotification, sendPushNotification } from "@/lib/notifications/send";
import { onCleanerAcceptedForPayment } from "@/lib/payments/preauth-flow";
import { getStripe } from "@/lib/stripe/server";

/** A new time means the old confirmation checks no longer apply. */
const RESET_CONFIRMATION_GATE = {
  confirmation_due_at: null,
  confirmation_gate: "none",
  confirmation_responded_at: null,
} as const;

function summary(changes: BookingChange[]) {
  return changes.map((change) => `${change.field}: ${change.to}`).join("; ");
}

/**
 * Admin edit of a booking after it was made. `preview: true` returns what
 * would change (including the new price) without saving anything.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = bookingEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const { data: booking } = await auth.admin
    .from("bookings")
    .select(EDIT_BOOKING_SELECT)
    .eq("id", params.id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const current = booking as unknown as EditableBooking;

  const result = await planBookingEdit(auth.admin, current, input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { plan } = result;

  const holdNeedsReplacing =
    plan.priceChanged && current.payment_status === "held" && Boolean(current.stripe_payment_intent_id);

  if (input.preview) {
    return NextResponse.json({
      changes: plan.changes,
      cleanerMustReconfirm: plan.cleanerMustReconfirm,
      holdNeedsReplacing,
      newCleanerPence: plan.newCleanerPence,
      newTotalPence: plan.newTotalPence,
      oldCleanerPence: plan.oldCleanerPence,
      oldTotalPence: plan.oldTotalPence,
    });
  }
  if (!plan.changes.length) {
    return NextResponse.json({ error: "Nothing has changed." }, { status: 400 });
  }

  // A held card is re-held for the new amount first. If the bank refuses,
  // nothing is changed and the old hold stays.
  const stripe = getStripe();
  let newIntentId: string | null = null;
  if (holdNeedsReplacing) {
    const { data: customer } = await auth.admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", current.customer_id)
      .maybeSingle();
    if (!customer?.stripe_customer_id || !current.stripe_payment_method_id) {
      return NextResponse.json(
        { error: "The customer has no saved card to hold the new amount on." },
        { status: 400 },
      );
    }
    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: plan.newTotalPence,
          capture_method: "manual",
          confirm: true,
          currency: "gbp",
          customer: customer.stripe_customer_id,
          metadata: {
            booking_id: current.id,
            reason: "admin_booking_edit",
            supabase_user_id: current.customer_id,
          },
          off_session: true,
          payment_method: current.stripe_payment_method_id,
        },
        { idempotencyKey: `edit_${current.id}_${plan.newTotalPence}_${Date.now()}`.slice(0, 255) },
      );
      if (intent.status !== "requires_capture") {
        await stripe.paymentIntents.cancel(intent.id).catch(() => undefined);
        return NextResponse.json(
          {
            error:
              "The customer's bank didn't accept a hold for the new amount, so nothing was changed. The original hold is still in place.",
          },
          { status: 402 },
        );
      }
      newIntentId = intent.id;
    } catch (error) {
      return NextResponse.json(
        {
          error: `The card couldn't be held for the new amount, so nothing was changed. ${
            error instanceof Error ? error.message : ""
          }`.trim(),
        },
        { status: 402 },
      );
    }
  }

  const updates: Record<string, unknown> = { ...plan.updates };
  if (plan.timeChanged) Object.assign(updates, RESET_CONFIRMATION_GATE);
  if (newIntentId) {
    updates.stripe_payment_intent_id = newIntentId;
    updates.payment_authorized_at = new Date().toISOString();
  }
  if (plan.cleanerMustReconfirm) {
    // The cleaner accepts the new time or place before the visit is confirmed.
    updates.status = "matched";
    updates.payment_auth_next_attempt_at = null;
  }

  const { data: saved, error: saveError } = await auth.admin
    .from("bookings")
    .update(updates)
    .eq("id", current.id)
    .eq("status", current.status)
    .select("id")
    .maybeSingle();
  if (saveError || !saved) {
    if (newIntentId) await stripe.paymentIntents.cancel(newIntentId).catch(() => undefined);
    return NextResponse.json(
      {
        error: saveError?.message ?? "The booking changed while you were editing it. Reload and try again.",
      },
      { status: 409 },
    );
  }
  if (newIntentId && current.stripe_payment_intent_id) {
    await stripe.paymentIntents.cancel(current.stripe_payment_intent_id).catch(() => undefined);
  }

  if (plan.addOnRows) {
    await auth.admin.from("booking_add_ons").delete().eq("booking_id", current.id);
    if (plan.addOnRows.length) {
      await auth.admin
        .from("booking_add_ons")
        .insert(plan.addOnRows.map((row) => ({ ...row, booking_id: current.id })));
    }
  }

  if (plan.cleanerMustReconfirm && current.cleaner_id) {
    await offerAdminAssignedJob(current.id, current.cleaner_id).catch(() => undefined);
  } else if (plan.timeChanged && current.status === "awaiting_payment" && current.cleaner_id) {
    // The card-hold window is worked out from the visit time.
    await onCleanerAcceptedForPayment(current.id).catch(() => undefined);
  }

  // Tell both sides what changed. The customer never sees cleaner pay, and the
  // cleaner never sees the customer's price.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const customerChanges = plan.changes.filter((change) => change.field !== "Cleaner pay");
  const cleanerChanges = plan.changes.filter((change) => change.field !== "Price");
  const customerBody = `We've updated your booking. ${summary(customerChanges)}.${
    plan.cleanerMustReconfirm ? " We're checking the new details with your cleaner and will confirm shortly." : ""
  }`;
  const { data: customer } = await auth.admin
    .from("profiles")
    .select("email,full_name,notification_preferences")
    .eq("id", current.customer_id)
    .maybeSingle();
  const firstName = customer?.full_name?.trim().split(/\s+/)[0];
  const customerPrefs = (customer?.notification_preferences ?? {}) as { email?: boolean };
  await Promise.all([
    createInAppNotification(current.customer_id, "booking_updated", "Your booking was updated", customerBody, {
      booking_id: current.id,
    }).then(
      () => undefined,
      () => undefined,
    ),
    sendPushNotification(current.customer_id, "Your booking was updated", customerBody, {
      booking_id: current.id,
    }).catch(() => undefined),
    customer?.email && customerPrefs.email !== false
      ? sendBrandedEmail({
          data: {
            actionLabel: "View your booking",
            actionUrl: `${appUrl}/booking/${current.id}`,
            body: `${firstName ? `Hi ${firstName}, ` : ""}${customerBody} If anything looks wrong, reply to this email.`,
            subject: "Mundoria: your booking was updated",
            title: "Your booking was updated",
          },
          template: "system.generic",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    current.cleaner_id && cleanerChanges.length && !plan.cleanerMustReconfirm
      ? notifyCleanerDayOf({
          body: `Mundoria has updated this job. ${summary(cleanerChanges)}.`,
          bookingId: current.id,
          cleanerId: current.cleaner_id,
          title: "Your job was updated",
        })
      : null,
  ]);

  await logAdminAction({
    action: "edit_booking",
    adminId: auth.user.id,
    entityId: current.id,
    entityType: "booking",
    metadata: {
      changes: plan.changes,
      cleanerMustReconfirm: plan.cleanerMustReconfirm,
      newIntentId,
      previousIntentId: newIntentId ? current.stripe_payment_intent_id : null,
    },
    reason: input.note,
  });

  return NextResponse.json({
    changes: plan.changes,
    cleanerMustReconfirm: plan.cleanerMustReconfirm,
    success: true,
  });
}
