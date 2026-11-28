import { assertNoSafetyHold } from "@/lib/bookings/safety-alert";
import { checkInWindowMessage } from "@/lib/bookings/schedule";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { getDistanceInMetres } from "@/lib/maps/distance";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { scheduleNextDayCapture } from "@/lib/payments/lifecycle";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingServiceName } from "@/lib/customer/services";
import { logEmail } from "@/lib/email/log";

export async function validateBookingGeofence({
  action,
  bookingId,
  cleanerId,
  latitude,
  longitude,
}: {
  action: "checkin" | "checkout";
  bookingId: string;
  cleanerId: string;
  latitude: number;
  longitude: number;
}) {
  const admin = createAdminClient();
  const [{ data: booking }, { data: settings }, { data: cleanerProfile }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
      )
      .eq("id", bookingId)
      .eq("cleaner_id", cleanerId)
      .single(),
    admin
      .from("platform_settings")
      .select("geofence_radius_meters")
      .eq("id", true)
      .single(),
    admin
      .from("cleaner_profiles")
      .select("location_tracking_consent_at,location_tracking_consent_version")
      .eq("id", cleanerId)
      .single(),
  ]);
  if (!booking?.address) throw new Error("Booking not found.");
  await assertNoSafetyHold(bookingId);
  if (!cleanerProfile?.location_tracking_consent_at) {
    throw new Error("Location consent is required before check-in/check-out.");
  }
  const allowedStatuses =
    action === "checkin"
      ? ["confirmed", "cleaner_en_route"]
      : ["in_progress"];
  if (!allowedStatuses.includes(booking.status)) {
    throw new Error(
      `${action === "checkin" ? "Check-in" : "Check-out"} is not available while this booking is ${booking.status}.`,
    );
  }
  if (action === "checkin") {
    const windowMessage = checkInWindowMessage({
      estimatedDurationHours: booking.estimated_duration_hours,
      scheduledDate: booking.scheduled_date,
      scheduledStartTime: String(booking.scheduled_start_time),
    });
    if (windowMessage) throw new Error(windowMessage);
  }
  if (booking.address.latitude == null || booking.address.longitude == null) {
    throw new Error("Booking address has no coordinates.");
  }
  const distance = getDistanceInMetres(
    latitude,
    longitude,
    Number(booking.address.latitude),
    Number(booking.address.longitude),
  );
  const radius = settings?.geofence_radius_meters ?? 200;
  await admin.from("booking_location_events").insert({
    booking_id: bookingId,
    cleaner_id: cleanerId,
    consent_version: cleanerProfile.location_tracking_consent_version,
    distance_meters: distance,
    event_type: action,
    is_verified: distance <= radius,
    latitude,
    longitude,
  });
  if (distance > radius) {
    await admin.from("location_override_requests").insert({
      booking_id: bookingId,
      cleaner_id: cleanerId,
      distance_meters: distance,
      event_type: action,
      latitude,
      longitude,
      reason: "Automatic geofence validation failed",
    });
    await admin
      .from("bookings")
      .update(
        action === "checkin"
          ? { checkin_override_requested: true }
          : { checkout_override_requested: true },
      )
      .eq("id", bookingId);
    await alertAdmins(
      "geofence_failed",
      action === "checkin"
        ? "A cleaner checked in away from the home"
        : "A cleaner checked out away from the home",
      `Their phone put them about ${Math.round(distance)} metres from the booking address. That can be a GPS glitch, or they may not be at the right place.`,
      {
        booking_id: bookingId,
        "How they marked it": action === "checkin" ? "Arrived" : "Finished",
        "Rough distance": `About ${Math.round(distance)} metres`,
      },
    );
    return { distance, radius, valid: false as const };
  }

  if (action === "checkin") {
    await recordArrival({ bookingId, latitude, longitude });
  } else {
    await recordCheckout({ bookingId, cleanerId, latitude, longitude });
  }
  return { distance, radius, valid: true as const };
}

type VisitRow = {
  address: {
    address_line_1?: string | null;
    city?: string | null;
    postcode?: string | null;
  } | null;
  customer: {
    email?: string | null;
    full_name?: string | null;
    notification_preferences?: { email?: boolean } | null;
  } | null;
  customer_id: string;
  payment_status: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  service_type: string;
};

async function loadVisit(bookingId: string) {
  const { data } = await createAdminClient()
    .from("bookings")
    .select(
      "customer_id,payment_status,scheduled_date,scheduled_start_time,service_type,is_recurring,address:addresses(address_line_1,city,postcode),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
    )
    .eq("id", bookingId)
    .single();
  if (!data) throw new Error("Booking not found.");
  const one = <T,>(value: T | T[] | null) =>
    Array.isArray(value) ? (value[0] ?? null) : value;
  return {
    ...(data as unknown as VisitRow),
    address: one(data.address as VisitRow["address"] | VisitRow["address"][]),
    customer: one(data.customer as VisitRow["customer"] | VisitRow["customer"][]),
  } as VisitRow;
}

/**
 * The cleaner is at the door: start the 5-minute access grace and tell the
 * customer. Used by a verified check-in and by an admin accepting a check-in
 * that failed the GPS check.
 */
export async function recordArrival({
  bookingId,
  latitude,
  longitude,
}: {
  bookingId: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const admin = createAdminClient();
  const visit = await loadVisit(bookingId);
  const arrivedAt = new Date();
  await admin
    .from("bookings")
    .update({
      access_grace_ends_at: new Date(
        arrivedAt.getTime() + 5 * 60 * 1000,
      ).toISOString(),
      arrived_at: arrivedAt.toISOString(),
      checkin_latitude: latitude,
      checkin_longitude: longitude,
      checkin_override_requested: false,
      cleaner_live_latitude: latitude,
      cleaner_live_longitude: longitude,
      cleaner_location_updated_at: arrivedAt.toISOString(),
    })
    .eq("id", bookingId);
  await sendPushNotification(
    visit.customer_id,
    "Your cleaner has arrived",
    "They are outside. Please let them in.",
    { booking_id: bookingId },
  );
  await sendVisitEmail(bookingId, visit, "customer.cleaner_checked_in");
}

/**
 * The clean is finished: move to customer confirmation, schedule the
 * next-day capture, and ask the customer to review. Used by a verified
 * check-out and by an admin accepting a check-out that failed the GPS check.
 */
export async function recordCheckout({
  bookingId,
  cleanerId,
  latitude,
  longitude,
}: {
  bookingId: string;
  cleanerId: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const admin = createAdminClient();
  const visit = await loadVisit(bookingId);
  const now = new Date().toISOString();
  const { data: moved } = await admin
    .from("bookings")
    .update({
      actual_end_time: now,
      checkout_latitude: latitude,
      checkout_longitude: longitude,
      checkout_override_requested: false,
      checkout_verified: true,
      cleaner_marked_complete_at: now,
      status: "awaiting_customer_confirmation",
    })
    .eq("id", bookingId)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();
  if (!moved) return;
  await ensureCaptureScheduled(bookingId, visit.payment_status);
  const { data: cleaner } = await admin
    .from("cleaner_profiles")
    .select("total_jobs")
    .eq("id", cleanerId)
    .single();
  await admin
    .from("cleaner_profiles")
    .update({ total_jobs: Number(cleaner?.total_jobs ?? 0) + 1 })
    .eq("id", cleanerId);
  await sendPushNotification(
    visit.customer_id,
    "Confirm your completed clean",
    "Your cleaner has checked out. Please review the completed checklist.",
    { booking_id: bookingId },
  );
  await sendVisitEmail(bookingId, visit, "customer.checklist_confirmation");
}

/**
 * The visit is done: make sure the held payment is captured next day (UK).
 * Safe to call more than once. Alerts admins if there's no hold to capture.
 */
export async function ensureCaptureScheduled(
  bookingId: string,
  paymentStatus?: string,
) {
  const admin = createAdminClient();
  let status = paymentStatus;
  if (!status) {
    const { data } = await admin
      .from("bookings")
      .select("payment_status")
      .eq("id", bookingId)
      .single();
    status = data?.payment_status;
  }
  if (status === "held") {
    try {
      await scheduleNextDayCapture(bookingId);
    } catch {
      await alertAdmins(
        "payment_failed",
        "The clean finished but we could not set up the charge",
        "The cleaner marked the job complete, but taking payment the next day could not be set up. Please open the booking and follow up so the customer is still charged.",
        { booking_id: bookingId },
      );
    }
  } else if (status === "unpaid") {
    await alertAdmins(
      "payment_failed",
      "A clean finished before payment was set up",
      "The cleaner marked the job complete, but we still do not have a payment hold on the customer’s card. Please open the booking and sort payment.",
      { booking_id: bookingId },
    );
  }
}

function sendVisitEmail(
  bookingId: string,
  visit: VisitRow,
  template: "customer.cleaner_checked_in" | "customer.checklist_confirmation",
) {
  const customer = visit.customer;
  if (!customer?.email) return false;
  if (customer.notification_preferences?.email === false) {
    void logEmail({
      data: { bookingId },
      error: "Customer has email notifications turned off.",
      status: "skipped",
      template,
      to: customer.email,
    });
    return false;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const address = visit.address;
  return sendBrandedEmail({
    data: {
      address: [address?.address_line_1, address?.city, address?.postcode]
        .filter(Boolean)
        .join(", "),
      appUrl,
      bookingId,
      bookingUrl: `${appUrl}/booking/${bookingId}`,
      firstName: customer.full_name?.split(" ")[0],
      fullName: customer.full_name,
      scheduledDate: visit.scheduled_date,
      scheduledTime: visit.scheduled_start_time?.slice(0, 5),
      serviceName: bookingServiceName(visit as { is_recurring?: boolean | null; service_type: string }),
    },
    template,
    to: customer.email,
  }).catch(() => false);
}
