import {
  formatAddressLine,
  SAFETY_REASON_LABELS,
  safetyAlertAllowed,
  type SafetyAlertReason,
} from "@/lib/bookings/safety-alert-shared";
import { alertAdmins } from "@/lib/notifications/admin";
import {
  createInAppNotification,
  sendPushNotification,
  sendSMS,
} from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

export {
  formatAddressLine,
  SAFETY_ALERT_REASONS,
  SAFETY_REASON_LABELS,
  safetyAlertAllowed,
  type SafetyAlertReason,
  type SafetyAlertStatus,
} from "@/lib/bookings/safety-alert-shared";

const LIVE_STATUSES = ["confirmed", "cleaner_en_route", "in_progress"] as const;
const WITHDRAW_WINDOW_MS = 15 * 60 * 1000;

export async function createSafetyAlert({
  bookingId,
  clientLatitude,
  clientLongitude,
  clientUserAgent,
  note,
  reason,
  userId,
}: {
  bookingId: string;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  clientUserAgent?: string | null;
  note?: string | null;
  reason: SafetyAlertReason;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,cleaner_id,status,scheduled_date,scheduled_start_time,safety_hold_at,address:addresses(*)",
    )
    .eq("id", bookingId)
    .or(`customer_id.eq.${userId},cleaner_id.eq.${userId}`)
    .maybeSingle();

  if (!booking) throw new Error("Booking not found.");
  if (!LIVE_STATUSES.includes(booking.status as (typeof LIVE_STATUSES)[number])) {
    throw new Error("Safety alerts are only available during a live session.");
  }
  if (!safetyAlertAllowed(booking.status, booking.scheduled_date)) {
    throw new Error("Safety alerts open on the day of the visit.");
  }

  const raisedByRole =
    userId === booking.customer_id ? "customer" : "cleaner";
  if (raisedByRole === "cleaner" && booking.cleaner_id !== userId) {
    throw new Error("Booking not found.");
  }

  const { data: existing } = await admin
    .from("booking_safety_alerts")
    .select("id,status")
    .eq("booking_id", bookingId)
    .in("status", ["open", "acknowledged", "in_progress"])
    .maybeSingle();
  if (existing) {
    throw new Error("A safety alert is already open on this booking.");
  }

  const address = Array.isArray(booking.address)
    ? booking.address[0]
    : booking.address;
  const now = new Date().toISOString();
  const trimmedNote = note?.trim() || null;

  const { data: alert, error } = await admin
    .from("booking_safety_alerts")
    .insert({
      address_latitude:
        address?.latitude != null ? Number(address.latitude) : null,
      address_line: formatAddressLine(address),
      address_longitude:
        address?.longitude != null ? Number(address.longitude) : null,
      booking_id: bookingId,
      booking_status_snapshot: booking.status,
      cleaner_id: booking.cleaner_id,
      client_latitude: clientLatitude ?? null,
      client_longitude: clientLongitude ?? null,
      client_user_agent: clientUserAgent ?? null,
      customer_id: booking.customer_id,
      note: trimmedNote,
      raised_by: userId,
      raised_by_role: raisedByRole,
      reason,
      scheduled_date: booking.scheduled_date,
      scheduled_start_time: booking.scheduled_start_time,
      severity: "urgent",
      status: "open",
    })
    .select("id,created_at,reason,raised_by_role")
    .single();

  if (error || !alert) {
    throw new Error(error?.message ?? "Unable to create the safety alert.");
  }

  await admin
    .from("bookings")
    .update({ safety_hold_at: now })
    .eq("id", bookingId);

  const reasonLabel = SAFETY_REASON_LABELS[reason];
  const shortId = bookingId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const adminHref = `${appUrl}/admin/safety/${alert.id}`;

  await alertAdmins(
    "sos",
    "SAFETY ALERT",
    `${raisedByRole} raised a safety alert on booking #${shortId}: ${reasonLabel}. ${adminHref}`,
    {
      alert_id: alert.id,
      booking_id: bookingId,
      reason,
      reported_by: userId,
      reported_by_role: raisedByRole,
    },
  );

  const onCallPhone =
    process.env.ADMIN_ONCALL_PHONE?.trim() ||
    process.env.ADMIN_NOTIFICATION_PHONE?.trim();
  if (onCallPhone) {
    try {
      await sendSMS(
        onCallPhone,
        `Mundoria SAFETY ALERT #${shortId}: ${reasonLabel}. ${adminHref}`,
      );
    } catch {
      // SMS should not block the alert.
    }
  }

  const otherId =
    userId === booking.customer_id ? booking.cleaner_id : booking.customer_id;
  if (otherId) {
    await sendPushNotification(
      otherId,
      "Safety alert on this booking",
      "A safety alert was raised on this booking. Mundoria is handling it. Do not contact the other party about this unless Mundoria asks.",
      { alert_id: alert.id, booking_id: bookingId },
    );
    await createInAppNotification(
      otherId,
      "safety_alert",
      "Safety alert on this booking",
      "A safety alert was raised. Mundoria is handling it.",
      { alert_id: alert.id, booking_id: bookingId },
    );
  }

  await createInAppNotification(
    userId,
    "safety_alert",
    "Safety alert sent",
    `We’re on it. Case reference ${alert.id.slice(0, 8)}. If you are still in danger, call 999.`,
    { alert_id: alert.id, booking_id: bookingId },
  );

  return alert;
}

export async function withdrawSafetyAlert({
  alertId,
  userId,
}: {
  alertId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: alert } = await admin
    .from("booking_safety_alerts")
    .select("id,booking_id,raised_by,status,created_at")
    .eq("id", alertId)
    .eq("raised_by", userId)
    .maybeSingle();

  if (!alert) throw new Error("Safety alert not found.");
  if (!["open", "acknowledged"].includes(alert.status)) {
    throw new Error("This alert can no longer be withdrawn.");
  }
  if (
    Date.now() - new Date(alert.created_at).getTime() >
    WITHDRAW_WINDOW_MS
  ) {
    throw new Error("The 15-minute window to withdraw this alert has passed.");
  }

  const now = new Date().toISOString();
  await admin
    .from("booking_safety_alerts")
    .update({
      status: "withdrawn",
      updated_at: now,
      withdrawn_at: now,
    })
    .eq("id", alertId);

  await alertAdmins(
    "sos",
    "Safety alert withdrawn",
    `The raiser withdrew safety alert ${alertId.slice(0, 8)} on booking ${alert.booking_id.slice(0, 8)}. Hold remains until ops clear it.`,
    { alert_id: alertId, booking_id: alert.booking_id },
  );

  return { success: true as const };
}

export async function assertNoSafetyHold(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("safety_hold_at")
    .eq("id", bookingId)
    .maybeSingle();
  if (booking?.safety_hold_at) {
    throw new Error(
      "This booking is on a safety hold. Mundoria must clear it before the session can continue.",
    );
  }
}

export async function adminUpdateSafetyAlert({
  action,
  adminId,
  alertId,
  outcomeNotes,
}: {
  action: "acknowledge" | "in_progress" | "resolve_continue" | "resolve_cancel";
  adminId: string;
  alertId: string;
  outcomeNotes?: string | null;
}) {
  const admin = createAdminClient();
  const { data: alert } = await admin
    .from("booking_safety_alerts")
    .select("*")
    .eq("id", alertId)
    .maybeSingle();
  if (!alert) throw new Error("Safety alert not found.");

  const now = new Date().toISOString();
  const notes = outcomeNotes?.trim() || null;

  if (action === "acknowledge") {
    await admin
      .from("booking_safety_alerts")
      .update({
        acknowledged_at: now,
        acknowledged_by: adminId,
        status: "acknowledged",
        updated_at: now,
      })
      .eq("id", alertId);
    return;
  }

  if (action === "in_progress") {
    await admin
      .from("booking_safety_alerts")
      .update({
        acknowledged_at: alert.acknowledged_at ?? now,
        acknowledged_by: alert.acknowledged_by ?? adminId,
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", alertId);
    return;
  }

  if (action === "resolve_continue" || action === "resolve_cancel") {
    if (!notes || notes.length < 3) {
      throw new Error("Add outcome notes before resolving.");
    }
    await admin
      .from("booking_safety_alerts")
      .update({
        outcome_notes: notes,
        resolved_at: now,
        resolved_by: adminId,
        status: "resolved",
        updated_at: now,
      })
      .eq("id", alertId);

    await admin
      .from("bookings")
      .update({ safety_hold_at: null })
      .eq("id", alert.booking_id);

    if (action === "resolve_cancel") {
      await admin
        .from("bookings")
        .update({
          cancellation_reason: `Cancelled after safety alert: ${notes}`,
          status: "cancelled",
        })
        .eq("id", alert.booking_id)
        .in("status", ["confirmed", "cleaner_en_route", "in_progress", "matched"]);
    }

    for (const partyId of [alert.customer_id, alert.cleaner_id]) {
      if (!partyId) continue;
      await sendPushNotification(
        partyId,
        "Safety review updated",
        action === "resolve_cancel"
          ? "Mundoria closed this booking after a safety review."
          : "Mundoria cleared the safety hold. Check your booking for next steps.",
        { alert_id: alertId, booking_id: alert.booking_id },
      );
    }
  }
}
