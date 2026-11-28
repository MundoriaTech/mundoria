import * as Sentry from "@sentry/nextjs";

import { ukDate } from "@/lib/admin/format";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";
import { appUrl } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { noteCustomerInZoho } from "@/lib/zoho/sync-jobs";

/**
 * A note on the customer's Zoho Contact for a booking milestone (booked,
 * cancelled, completed, no-show, admin change, dispute, refund). Never throws.
 */
export async function noteBookingInZoho(bookingId: string, event: string, detail?: string | null) {
  try {
    const { data: booking } = await createAdminClient()
      .from("bookings")
      .select("id,customer_id,service_type,scheduled_date,scheduled_start_time,amount_total,status")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking?.customer_id) return;
    let service = String(booking.service_type ?? "Clean");
    try {
      service = formatServiceName(booking.service_type as ServiceType);
    } catch {
      // Unknown service type: keep the raw value.
    }
    const when = [
      booking.scheduled_date ? ukDate(`${booking.scheduled_date}T12:00:00Z`, true) : null,
      booking.scheduled_start_time ? String(booking.scheduled_start_time).slice(0, 5) : null,
    ].filter(Boolean).join(" ");
    const lines = [
      `${event}: ${service}${when ? ` on ${when}` : ""}${
        typeof booking.amount_total === "number" ? `, ${formatMoney(booking.amount_total)}` : ""
      }.`,
      detail?.trim() ? detail.trim() : null,
      `Status in Mundoria: ${String(booking.status).replaceAll("_", " ")}.`,
      `${appUrl()}/admin/booking/${booking.id}`,
    ].filter(Boolean);
    await noteCustomerInZoho(
      booking.customer_id as string,
      `Booking ${event.toLowerCase()}`,
      lines.join("\n"),
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}
