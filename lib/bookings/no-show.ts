import { addHours } from "date-fns";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { runMatchingEngine } from "@/lib/matching/engine";
import { alertAdmins } from "@/lib/notifications/admin";
import {
  sendPushNotification,
} from "@/lib/notifications/send";
import { refundBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoCancelProtected } from "@/lib/bookings/auto-cancel-test";
import { noteBookingInZoho } from "@/lib/zoho/booking-notes";

export async function handleNoShow(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*,customer:profiles!bookings_customer_id_fkey(email)")
    .eq("id", bookingId)
    .single();
  if (!booking) throw new Error("Booking not found.");
  if (!["confirmed", "cleaner_en_route"].includes(booking.status)) {
    throw new Error(`Booking cannot be marked no-show from ${booking.status}.`);
  }
  const cleanerId = booking.cleaner_id as string | null;
  if (cleanerId) {
    const { data: cleaner } = await admin
      .from("cleaner_profiles")
      .select("no_show_count")
      .eq("id", cleanerId)
      .single();
    await admin
      .from("cleaner_profiles")
      .update({ no_show_count: Number(cleaner?.no_show_count ?? 0) + 1 })
      .eq("id", cleanerId);
  }
  const deadline = addHours(new Date(), 1);
  await admin
    .from("bookings")
    .update({
      cleaner_id: null,
      no_show_cleaner_id: cleanerId,
      no_show_recorded_at: new Date().toISOString(),
      replacement_deadline: deadline.toISOString(),
      status: "no_show",
    })
    .eq("id", bookingId);
  await Promise.all([
    alertAdmins(
      "cleaner_no_show",
      "A cleaner did not arrive",
      "The assigned cleaner did not show up. Please find a replacement and tell the customer what will happen.",
      { booking_id: bookingId, cleaner_id: cleanerId },
    ),
    sendPushNotification(
      booking.customer_id,
      "We're finding a replacement",
      "Your cleaner did not check in. We are matching another cleaner now.",
      { booking_id: bookingId },
    ),
  ]);
  const match = await runMatchingEngine(bookingId, {
    excludeCleanerIds: cleanerId ? [cleanerId] : [],
  });
  await noteBookingInZoho(bookingId, "Cleaner did not arrive", "Marked as a no-show; Mundoria is finding a replacement.");
  return { deadline, match };
}

export async function cancelExpiredReplacement(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("customer_id,status,payment_status,stripe_payment_intent_id,auto_cancel_exempt,customer:profiles!bookings_customer_id_fkey(email)")
    .eq("id", bookingId)
    .single();
  if (!booking || !["no_show", "pending_match"].includes(booking.status)) {
    return false;
  }
  // Protected bookings are never cancelled automatically (admins were
  // already alerted about the no-show).
  if (isAutoCancelProtected(booking)) return false;
  const customer = Array.isArray(booking.customer)
    ? booking.customer[0]
    : booking.customer;
  // Release/refund only when there is a payment; an unpaid booking has none.
  if (
    booking.stripe_payment_intent_id &&
    ["held", "released"].includes(booking.payment_status)
  ) {
    await refundBookingPayment(bookingId);
  }
  const { data: cancelledRow } = await admin
    .from("bookings")
    .update({
      cancelled_at: new Date().toISOString(),
      cancellation_reason: "No replacement cleaner found within one hour.",
      status: "cancelled",
    })
    .eq("id", bookingId)
    .in("status", ["no_show", "pending_match"])
    .select("id")
    .maybeSingle();
  if (!cancelledRow) return false;
  await noteBookingInZoho(bookingId, "Cancelled: no replacement cleaner", "No replacement was found within one hour. The customer was not charged.");
  await sendPushNotification(
    booking.customer_id,
    "Booking cancelled",
    "We could not find a replacement within one hour, so we've cancelled the visit. You have not been charged.",
    { booking_id: bookingId },
  );
  if (customer?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendBrandedEmail({
      data: {
        appUrl,
        bookingId,
        bookingUrl: `${appUrl}/booking/${bookingId}`,
        reason:
          "We could not find a replacement within one hour, so we've cancelled the visit. You have not been charged.",
      },
      template: "customer.booking_cancelled",
      to: customer.email,
    });
  }
  return true;
}
