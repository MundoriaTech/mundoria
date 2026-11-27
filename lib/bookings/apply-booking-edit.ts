import type { BookingChange, BookingEditPlan, EditableBooking } from "@/lib/admin/booking-edit";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { offerAdminAssignedJob } from "@/lib/matching/admin-offer";
import { alertAdmins } from "@/lib/notifications/admin";
import { notifyCleanerDayOf } from "@/lib/notifications/cleaner-day-of";
import { createInAppNotification, sendPushNotification } from "@/lib/notifications/send";
import { onCleanerAcceptedForPayment } from "@/lib/payments/preauth-flow";
import { getStripe } from "@/lib/stripe/server";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** A new time means the old confirmation checks no longer apply. */
const RESET_CONFIRMATION_GATE = {
  confirmation_due_at: null,
  confirmation_gate: "none",
  confirmation_responded_at: null,
} as const;

function summary(changes: BookingChange[]) {
  return changes.map((change) => `${change.field}: ${change.to}`).join("; ");
}

export function holdNeedsReplacing(booking: EditableBooking, plan: BookingEditPlan) {
  return plan.priceChanged && booking.payment_status === "held" && Boolean(booking.stripe_payment_intent_id);
}

/**
 * Saves a planned booking edit (from planBookingEdit), for an admin or the
 * customer. A held card is re-held for the new amount before anything is
 * saved: if the bank refuses, nothing changes and the old hold stays. Then
 * the cleaner re-accepts a new time or address where needed, and both sides
 * are told what changed.
 */
export async function applyBookingEdit({
  actor,
  actorId,
  admin,
  booking,
  plan,
  reason,
  undoOf,
}: {
  actor: "admin" | "customer";
  actorId: string;
  admin: Admin;
  booking: EditableBooking;
  plan: BookingEditPlan;
  reason: string;
  /** The edit this one reverses, when it's an undo. */
  undoOf?: string;
}): Promise<{ error: string; status: number } | { editId: string | null; newIntentId: string | null }> {
  const stripe = getStripe();
  let newIntentId: string | null = null;
  if (holdNeedsReplacing(booking, plan)) {
    const { data: customer } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", booking.customer_id)
      .maybeSingle();
    if (!customer?.stripe_customer_id || !booking.stripe_payment_method_id) {
      return { error: "There's no saved card to hold the new amount on.", status: 400 };
    }
    const refused =
      actor === "admin"
        ? "The customer's bank didn't accept a hold for the new amount, so nothing was changed. The original hold is still in place."
        : "Your bank didn't accept a hold for the new amount, so nothing was changed. Your booking stays as it was.";
    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: plan.newTotalPence,
          capture_method: "manual",
          confirm: true,
          currency: "gbp",
          customer: customer.stripe_customer_id,
          metadata: {
            booking_id: booking.id,
            reason: `${actor}_booking_edit`,
            supabase_user_id: booking.customer_id,
          },
          off_session: true,
          payment_method: booking.stripe_payment_method_id,
        },
        { idempotencyKey: `edit_${booking.id}_${plan.newTotalPence}_${Date.now()}`.slice(0, 255) },
      );
      if (intent.status !== "requires_capture") {
        await stripe.paymentIntents.cancel(intent.id).catch(() => undefined);
        return { error: refused, status: 402 };
      }
      newIntentId = intent.id;
    } catch {
      return { error: refused, status: 402 };
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

  // What the booking looked like before, so the edit can be shown and undone.
  const beforeValues: Record<string, unknown> = {};
  for (const key of Object.keys(plan.updates)) {
    beforeValues[key] = (booking as unknown as Record<string, unknown>)[key] ?? null;
  }
  const { data: addOnsBefore } = plan.addOnRows
    ? await admin.from("booking_add_ons").select("add_on_id,amount,label").eq("booking_id", booking.id)
    : { data: null };

  const { data: saved, error: saveError } = await admin
    .from("bookings")
    .update(updates)
    .eq("id", booking.id)
    .eq("status", booking.status)
    .select("id")
    .maybeSingle();
  if (saveError || !saved) {
    if (newIntentId) await stripe.paymentIntents.cancel(newIntentId).catch(() => undefined);
    return {
      error: saveError?.message ?? "The booking changed in the meantime. Reload the page and try again.",
      status: 409,
    };
  }
  if (newIntentId && booking.stripe_payment_intent_id) {
    await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id).catch(() => undefined);
  }

  if (plan.addOnRows) {
    await admin.from("booking_add_ons").delete().eq("booking_id", booking.id);
    if (plan.addOnRows.length) {
      await admin
        .from("booking_add_ons")
        .insert(plan.addOnRows.map((row) => ({ ...row, booking_id: booking.id })));
    }
  }

  const { data: editRow } = await admin
    .from("booking_edits")
    .insert({
      actor_id: actorId,
      actor_type: actor,
      add_ons_after: plan.addOnRows,
      add_ons_before: plan.addOnRows ? (addOnsBefore ?? []) : null,
      after_values: plan.updates,
      before_values: beforeValues,
      booking_id: booking.id,
      changes: plan.changes,
      cleaner_must_reconfirm: plan.cleanerMustReconfirm,
      new_payment_intent_id: newIntentId,
      previous_payment_intent_id: newIntentId ? booking.stripe_payment_intent_id : null,
      reason,
      undo_of: undoOf ?? null,
    })
    .select("id")
    .maybeSingle();

  if (plan.cleanerMustReconfirm && booking.cleaner_id) {
    await offerAdminAssignedJob(booking.id, booking.cleaner_id).catch(() => undefined);
  } else if (plan.timeChanged && booking.status === "awaiting_payment" && booking.cleaner_id) {
    // The card-hold window is worked out from the visit time.
    await onCleanerAcceptedForPayment(booking.id).catch(() => undefined);
  }

  // The customer never sees cleaner pay; the cleaner never sees the price.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const customerChanges = plan.changes.filter((change) => change.field !== "Cleaner pay");
  const cleanerChanges = plan.changes.filter((change) => change.field !== "Price");
  const reconfirmNote = plan.cleanerMustReconfirm
    ? " We're checking the new details with your cleaner and will confirm shortly."
    : "";
  const customerTitle = actor === "admin" ? "Your booking was updated" : "Your booking changes are saved";
  const customerBody = `${
    actor === "admin" ? "We've updated your booking." : "You changed your booking."
  } ${summary(customerChanges)}.${reconfirmNote}`;
  const { data: customer } = await admin
    .from("profiles")
    .select("email,full_name,notification_preferences")
    .eq("id", booking.customer_id)
    .maybeSingle();
  const firstName = customer?.full_name?.trim().split(/\s+/)[0];
  const customerPrefs = (customer?.notification_preferences ?? {}) as { email?: boolean };
  const cleanerBody = `${
    actor === "admin" ? "Mundoria has updated this job." : "The customer has updated this job."
  } ${summary(cleanerChanges)}.`;

  await Promise.all([
    // The customer made the change themselves and sees it on screen, so
    // only an admin change gets an in-app pop-up and push.
    actor === "admin"
      ? createInAppNotification(booking.customer_id, "booking_updated", customerTitle, customerBody, {
          booking_id: booking.id,
        }).then(
          () => undefined,
          () => undefined,
        )
      : null,
    actor === "admin"
      ? sendPushNotification(booking.customer_id, customerTitle, customerBody, {
          booking_id: booking.id,
        }).catch(() => undefined)
      : null,
    customer?.email && customerPrefs.email !== false
      ? sendBrandedEmail({
          data: {
            actionLabel: "View your booking",
            actionUrl: `${appUrl}/booking/${booking.id}`,
            body: `${firstName ? `Hi ${firstName}, ` : ""}${customerBody} If anything looks wrong, reply to this email.`,
            subject: `Mundoria: ${customerTitle.toLowerCase()}`,
            title: customerTitle,
          },
          template: "system.generic",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    booking.cleaner_id && cleanerChanges.length && !plan.cleanerMustReconfirm
      ? notifyCleanerDayOf({
          body: cleanerBody,
          bookingId: booking.id,
          cleanerId: booking.cleaner_id,
          title: "Your job was updated",
        })
      : null,
    // Admins hear about every change, whoever made it.
    alertAdmins(
      "booking_updated",
      undoOf
        ? "A booking edit was undone"
        : actor === "customer"
          ? "A customer changed their booking"
          : "An admin changed a booking",
      `${summary(plan.changes)}.${actor === "admin" ? ` Reason: ${reason}` : ""}${
        plan.cleanerMustReconfirm ? " The cleaner has been asked to accept the new details." : ""
      }`,
      { booking_id: booking.id, edited_by: actorId },
    ).catch(() => undefined),
  ]);

  return { editId: editRow?.id ?? null, newIntentId };
}
