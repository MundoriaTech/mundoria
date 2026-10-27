import { addDays, format } from "date-fns";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { ensureUpcomingRecurringFollowOns } from "@/lib/bookings/recurring";
import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  createInAppNotification,
  sendPushNotification,
} from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatServiceName } from "@/lib/customer/services";
import { getSiteUrl } from "@/lib/seo/site";

/**
 * Rolls forward the next unpaid recurring visit when needed, then reminds
 * customers who still need a saved card for visits in the T−7…T−2 window.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  let rolled = { created: 0 };
  try {
    rolled = await ensureUpcomingRecurringFollowOns(admin);
  } catch {
    // Reminders should still run even if roll-forward fails.
  }

  const today = new Date();
  const from = format(addDays(today, 2), "yyyy-MM-dd");
  const to = format(addDays(today, 7), "yyyy-MM-dd");

  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      "id,customer_id,service_type,scheduled_date,scheduled_start_time,amount_total,stripe_payment_method_id,parent_booking_id,payment_status,status",
    )
    .not("parent_booking_id", "is", null)
    .eq("payment_status", "unpaid")
    .is("stripe_payment_method_id", null)
    .neq("status", "cancelled")
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let reminded = 0;
  const failures: string[] = [];

  for (const booking of bookings ?? []) {
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("email,full_name")
        .eq("id", booking.customer_id)
        .single();

      if (!profile?.email) {
        failures.push(booking.id);
        continue;
      }

      const serviceLabel = formatServiceName(booking.service_type);
      const when = `${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)}`;
      const payHref = `${getSiteUrl()}/booking/${booking.id}`;

      await createInAppNotification(
        booking.customer_id,
        "recurring_payment_due",
        "Upcoming visit needs a card",
        `Save a card for your ${serviceLabel} on ${when}.`,
        { booking_id: booking.id },
      );
      await sendPushNotification(
        booking.customer_id,
        "Upcoming visit needs a card",
        `Save a card for your ${serviceLabel} on ${when}.`,
        { booking_id: booking.id },
      );
      await sendBrandedEmail({
        data: {
          actionLabel: "Save card for this visit",
          actionUrl: payHref,
          body: `Hi ${profile.full_name.split(" ")[0] ?? "there"}, your recurring ${serviceLabel} on ${when} still needs a saved card before we match a cleaner.`,
          subject: `Card needed for your Mundoria clean on ${booking.scheduled_date}`,
          title: "Save a card for your next visit",
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
    reminded,
    rolledForward: rolled.created,
    scanned: bookings?.length ?? 0,
  });
}
