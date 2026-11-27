import { bookingServiceName } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { logEmail } from "@/lib/email/log";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

/** Remind this long before the card is charged… */
const BEFORE_CHARGE_MS = 2 * 60 * 60 * 1000;
/** …but never sooner than this after the cleaner checked out. */
const AFTER_CHECKOUT_MS = 3 * 60 * 60 * 1000;

function chargeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Europe/London",
    weekday: "long",
  });
}

/**
 * Cron: one reminder to customers who haven't confirmed a finished visit,
 * about two hours before their card is charged, so they can raise a problem
 * first. Sent once per booking.
 */
export async function sendConfirmReminders(limit = 50) {
  const admin = createAdminClient();
  const now = Date.now();
  const { data: due } = await admin
    .from("bookings")
    .select("id,payment_capture_scheduled_for")
    .eq("status", "awaiting_customer_confirmation")
    .eq("payment_status", "held")
    .is("confirmation_reminder_sent_at", null)
    .gt("payment_capture_scheduled_for", new Date(now).toISOString())
    .lte("payment_capture_scheduled_for", new Date(now + BEFORE_CHARGE_MS).toISOString())
    .lte("cleaner_marked_complete_at", new Date(now - AFTER_CHECKOUT_MS).toISOString())
    .limit(limit);

  let sent = 0;
  for (const row of due ?? []) {
    // Claim it first so two cron runs never both send.
    const { data: claimed } = await admin
      .from("bookings")
      .update({ confirmation_reminder_sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("confirmation_reminder_sent_at", null)
      .select(
        "id,customer_id,scheduled_date,scheduled_start_time,service_type,is_recurring,address:addresses(address_line_1,city,postcode),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
      )
      .maybeSingle();
    if (!claimed) continue;

    const one = <T,>(value: T | T[] | null) => (Array.isArray(value) ? (value[0] ?? null) : value);
    const customer = one(claimed.customer as unknown) as {
      email?: string | null;
      full_name?: string | null;
      notification_preferences?: { email?: boolean } | null;
    } | null;
    const address = one(claimed.address as unknown) as {
      address_line_1?: string | null;
      city?: string | null;
      postcode?: string | null;
    } | null;
    const when = chargeLabel(String(row.payment_capture_scheduled_for));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
    const data = {
      address: [address?.address_line_1, address?.city, address?.postcode].filter(Boolean).join(", "),
      bookingId: claimed.id,
      bookingUrl: `${appUrl}/booking/${claimed.id}`,
      chargeLabel: `on ${when}`,
      firstName: customer?.full_name?.split(" ")[0],
      scheduledDate: claimed.scheduled_date,
      scheduledTime: String(claimed.scheduled_start_time ?? "").slice(0, 5),
      serviceName: bookingServiceName(claimed as { is_recurring?: boolean | null; service_type: string }),
    };

    await sendPushNotification(
      claimed.customer_id,
      "How did your clean go?",
      `Please confirm your clean, or tell us if anything wasn't done. Your card is charged on ${when}.`,
      { booking_id: claimed.id },
    ).catch(() => undefined);

    if (customer?.email && customer.notification_preferences?.email !== false) {
      await sendBrandedEmail({
        data,
        template: "customer.checklist_confirmation_reminder",
        to: customer.email,
      }).catch(() => undefined);
    } else if (customer?.email) {
      await logEmail({
        data,
        error: "Customer has email notifications turned off.",
        status: "skipped",
        template: "customer.checklist_confirmation_reminder",
        to: customer.email,
      });
    }
    sent += 1;
  }
  return { reminded: sent };
}

/** Cron: delete email_log rows older than 12 months. */
export async function purgeOldEmailLog() {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  await createAdminClient().from("email_log").delete().lt("created_at", cutoff);
}
