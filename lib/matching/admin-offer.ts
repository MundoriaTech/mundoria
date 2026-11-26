import { addHours, addMinutes } from "date-fns";

import { cleanerPayForDisplay } from "@/lib/cleaner/pay-display";
import { formatServiceName } from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";

const MAX_WINDOW_HOURS = 12;
const MIN_WINDOW_MINUTES = 30;

/**
 * Give a cleaner an admin has assigned a live offer they can accept, and tell
 * them about it. Without the offer the job is neither offered to them nor on
 * their job board (it already has a cleaner), so Accept is refused.
 *
 * They have until an hour before the visit to answer, at most 12 hours and
 * at least 30 minutes. An unanswered offer lapses like any other and the
 * booking goes back to matching.
 */
export async function offerAdminAssignedJob(bookingId: string, cleanerId: string) {
  const admin = createAdminClient();
  const [{ data: booking }, { data: cleaner }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id,amount_cleaner,scheduled_date,scheduled_start_time,service_type,address:addresses(city,postcode)",
      )
      .eq("id", bookingId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("email,notification_preferences")
      .eq("id", cleanerId)
      .maybeSingle(),
  ]);
  if (!booking) return;

  const now = new Date();
  const start = new Date(
    `${booking.scheduled_date}T${String(booking.scheduled_start_time).slice(0, 5)}:00`,
  );
  let respondBy = addHours(now, MAX_WINDOW_HOURS);
  if (!Number.isNaN(start.getTime())) {
    const hourBefore = addHours(start, -1);
    if (hourBefore < respondBy) respondBy = hourBefore;
  }
  const earliest = addMinutes(now, MIN_WINDOW_MINUTES);
  if (respondBy < earliest) respondBy = earliest;

  // "expired" with no responded_at is how a live, unanswered offer is stored.
  await admin.from("cleaner_job_responses").upsert(
    {
      booking_id: bookingId,
      cleaner_id: cleanerId,
      expires_at: respondBy.toISOString(),
      offered_at: now.toISOString(),
      responded_at: null,
      response: "expired",
    },
    { onConflict: "booking_id,cleaner_id" },
  );

  const serviceName = formatServiceName(booking.service_type as ServiceType);
  const shownPay = await cleanerPayForDisplay(bookingId, cleanerId, booking.amount_cleaner);
  const address = Array.isArray(booking.address) ? booking.address[0] : booking.address;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const wantsEmail =
    (cleaner?.notification_preferences as { email?: boolean } | null)?.email !== false;

  await Promise.all([
    sendPushNotification(
      cleanerId,
      "New cleaning job",
      `Mundoria has offered you a ${serviceName.toLowerCase()} job. Accept it in the app.`,
      { booking_id: bookingId },
    ).catch(() => undefined),
    admin
      .from("notifications")
      .insert({
        body: `Mundoria has offered you a ${serviceName.toLowerCase()} job on ${booking.scheduled_date} at ${String(booking.scheduled_start_time).slice(0, 5)}. Accept it before ${respondBy.toLocaleString("en-GB")}.`,
        data: { booking_id: bookingId },
        title: "New cleaning job",
        type: "job_offer",
        user_id: cleanerId,
      })
      .then(() => undefined, () => undefined),
    cleaner?.email && wantsEmail
      ? sendBrandedEmail({
          data: {
            address: [address?.city, address?.postcode?.split(/\s+/)[0]]
              .filter(Boolean)
              .join(", "),
            appUrl,
            bookingId,
            earnings:
              shownPay != null ? `£${(Number(shownPay) / 100).toFixed(2)}` : undefined,
            jobUrl: `${appUrl}/cleaner/job/${bookingId}`,
            respondBy: respondBy.toLocaleString("en-GB"),
            scheduledDate: booking.scheduled_date,
            scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
            serviceName,
          },
          template: "cleaner.job_offer",
          to: cleaner.email,
        }).catch(() => undefined)
      : null,
  ]);
}
