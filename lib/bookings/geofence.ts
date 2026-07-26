import { sendBrandedEmail } from "@/lib/email/send-email";
import { getDistanceInMetres } from "@/lib/maps/distance";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { captureBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!cleanerProfile?.location_tracking_consent_at) {
    throw new Error("Location consent is required before check-in/check-out.");
  }
  const allowedStatuses =
    action === "checkin"
      ? ["confirmed", "cleaner_en_route", "matched"]
      : ["in_progress"];
  if (!allowedStatuses.includes(booking.status)) {
    throw new Error(
      `${action === "checkin" ? "Check-in" : "Check-out"} is not available while this booking is ${booking.status}.`,
    );
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
      `${action === "checkin" ? "Check-in" : "Check-out"} needs review`,
      `Cleaner was ${Math.round(distance)}m from the booking address.`,
      { action, booking_id: bookingId, distance_metres: Math.round(distance) },
    );
    return { distance, radius, valid: false as const };
  }

  if (action === "checkin") {
    await admin
      .from("bookings")
      .update({
        actual_start_time: new Date().toISOString(),
        checkin_latitude: latitude,
        checkin_longitude: longitude,
        checkin_verified: true,
        status: "in_progress",
      })
      .eq("id", bookingId);
    await sendPushNotification(
      booking.customer_id,
      "Cleaner checked in",
      "Your cleaner has arrived and started the job.",
      { booking_id: bookingId },
    );
    await sendCustomerGeofenceEmail("customer.cleaner_checked_in");
  } else {
    await captureBookingPayment(bookingId);
    await admin
      .from("bookings")
      .update({
        actual_end_time: new Date().toISOString(),
        cleaner_marked_complete_at: new Date().toISOString(),
        checkout_latitude: latitude,
        checkout_longitude: longitude,
        checkout_verified: true,
        payment_status: "released",
        status: "awaiting_customer_confirmation",
      })
      .eq("id", bookingId);
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
      booking.customer_id,
      "Confirm your completed clean",
      "Your cleaner has checked out. Please review the completed checklist.",
      { booking_id: bookingId },
    );
    await sendCustomerGeofenceEmail("customer.checklist_confirmation");
  }
  return { distance, radius, valid: true as const };

  function sendCustomerGeofenceEmail(
    template: "customer.cleaner_checked_in" | "customer.checklist_confirmation",
  ) {
    const customer = Array.isArray(booking.customer)
      ? booking.customer[0]
      : booking.customer;
    const preferences = customer?.notification_preferences as
      | { email?: boolean }
      | undefined;
    if (!customer?.email || preferences?.email === false) return false;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return sendBrandedEmail({
      data: {
        address: `${booking.address.address_line_1}, ${booking.address.city}, ${booking.address.postcode}`,
        appUrl,
        bookingId,
        bookingUrl: `${appUrl}/booking/${bookingId}`,
        firstName: customer.full_name?.split(" ")[0],
        fullName: customer.full_name,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_start_time?.slice(0, 5),
        serviceName: String(booking.service_type).replaceAll("_", " "),
      },
      template,
      to: customer.email,
    });
  }
}
