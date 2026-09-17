import { addDays, format } from "date-fns";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { createManualPaymentIntent } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatServiceName } from "@/lib/customer/services";

/**
 * Reminds customers and prepares PaymentIntents for unpaid recurring visits
 * scheduled between T−7 and T−2 days from now.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const from = format(addDays(today, 2), "yyyy-MM-dd");
  const to = format(addDays(today, 7), "yyyy-MM-dd");

  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      "id,customer_id,service_type,scheduled_date,scheduled_start_time,amount_total,stripe_payment_intent_id,parent_booking_id,payment_status,status",
    )
    .not("parent_booking_id", "is", null)
    .eq("payment_status", "unpaid")
    .neq("status", "cancelled")
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let prepared = 0;
  let reminded = 0;
  const failures: string[] = [];

  for (const booking of bookings ?? []) {
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("email,full_name,stripe_customer_id")
        .eq("id", booking.customer_id)
        .single();

      if (!profile?.email) {
        failures.push(booking.id);
        continue;
      }

      const amount = Number(booking.amount_total ?? 0);
      if (amount < 100) {
        failures.push(booking.id);
        continue;
      }

      if (!booking.stripe_payment_intent_id) {
        await createManualPaymentIntent({
          amount,
          bookingId: booking.id,
          customerId: booking.customer_id,
          stripeCustomerId: profile.stripe_customer_id,
        });
        prepared += 1;
      }

      const serviceLabel = formatServiceName(booking.service_type);
      const when = `${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)}`;
      const payHref = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.com"}/booking/${booking.id}`;

      await createInAppNotification(
        booking.customer_id,
        "recurring_payment_due",
        "Upcoming visit payment",
        `Your ${serviceLabel} on ${when} still needs payment authorisation.`,
        { booking_id: booking.id },
      );
      await sendPushNotification(
        booking.customer_id,
        "Upcoming visit payment",
        `Authorise payment for your ${serviceLabel} on ${when}.`,
        { booking_id: booking.id },
      );
      await sendBrandedEmail({
        data: {
          actionLabel: "Pay for this visit",
          actionUrl: payHref,
          body: `Hi ${profile.full_name.split(" ")[0] ?? "there"}, your recurring ${serviceLabel} on ${when} needs payment authorisation before we match a cleaner.`,
          subject: `Payment due for your Mundoria clean on ${booking.scheduled_date}`,
          title: "Upcoming visit payment",
        },
        template: "system.generic",
        to: profile.email,
      });
      reminded += 1;
    } catch {
      failures.push(booking.id);
    }
  }

  return NextResponse.json({
    failures: failures.length,
    prepared,
    reminded,
    scanned: bookings?.length ?? 0,
  });
}
