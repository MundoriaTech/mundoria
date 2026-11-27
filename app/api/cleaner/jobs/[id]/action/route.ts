import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateBookingGeofence } from "@/lib/bookings/geofence";
import { getDistanceInMetres } from "@/lib/maps/distance";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { enRouteWindowMessage } from "@/lib/bookings/schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingServiceName } from "@/lib/customer/services";

const schema = z.object({
  action: z.enum(["en_route", "checkin", "checkout", "override"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job action." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status,scheduled_date,scheduled_start_time,address:addresses(latitude,longitude)")
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .single();
  if (!booking) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  const address = Array.isArray(booking.address)
    ? booking.address[0]
    : booking.address;

  if (parsed.data.action === "en_route") {
    const tooEarly = enRouteWindowMessage({
      scheduledDate: booking.scheduled_date,
      scheduledStartTime: booking.scheduled_start_time,
    });
    if (booking.status === "confirmed" && tooEarly) {
      return NextResponse.json({ error: tooEarly }, { status: 409 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json(
        {
          error:
            booking.status === "matched"
              ? "Accept the job before you set off."
              : `This job cannot start from ${booking.status}.`,
        },
        { status: 409 },
      );
    }
    await admin
      .from("bookings")
      .update({ status: "cleaner_en_route" })
      .eq("id", params.id)
      .eq("cleaner_id", user.id);
    await notifyCustomerEnRoute(params.id).catch(() => undefined);
    return NextResponse.json({ success: true });
  }

  const { latitude, longitude } = parsed.data;
  // A manual review can be asked for even when the phone gives no location.
  if (
    parsed.data.action === "override" &&
    (latitude === undefined || longitude === undefined)
  ) {
    return requestOverride({
      bookingId: params.id,
      cleanerId: user.id,
      distance: null,
      latitude: null,
      longitude: null,
      reason: parsed.data.reason ?? "Cleaner's phone could not share its location",
      status: booking.status,
    });
  }
  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json(
      { error: "GPS coordinates are required." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "checkin" || parsed.data.action === "checkout") {
    try {
      return NextResponse.json(
        await validateBookingGeofence({
          action: parsed.data.action,
          bookingId: params.id,
          cleanerId: user.id,
          latitude,
          longitude,
        }),
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Action failed." },
        { status: 400 },
      );
    }
  }

  if (
    address?.latitude == null ||
    address.longitude == null
  ) {
    return NextResponse.json(
      { error: "The job address has no coordinates." },
      { status: 400 },
    );
  }
  const distance = getDistanceInMetres(
    latitude,
    longitude,
    Number(address.latitude),
    Number(address.longitude),
  );
  return requestOverride({
    bookingId: params.id,
    cleanerId: user.id,
    distance,
    latitude,
    longitude,
    reason: parsed.data.reason ?? "Cleaner requested manual location review",
    status: booking.status,
  });
}

/** Ask an admin to accept arrival or finish, with or without a location. */
async function requestOverride(input: {
  bookingId: string;
  cleanerId: string;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  reason: string;
  status: string;
}) {
  const admin = createAdminClient();
  const eventType = input.status === "in_progress" ? "checkout" : "checkin";
  const { data: existing } = await admin
    .from("location_override_requests")
    .select("id")
    .eq("booking_id", input.bookingId)
    .eq("cleaner_id", input.cleanerId)
    .eq("event_type", eventType)
    .eq("status", "pending")
    .maybeSingle();
  if (!existing) {
    await admin.from("location_override_requests").insert({
      booking_id: input.bookingId,
      cleaner_id: input.cleanerId,
      distance_meters: input.distance,
      event_type: eventType,
      latitude: input.latitude,
      longitude: input.longitude,
      reason: input.reason,
    });
    await admin
      .from("bookings")
      .update(
        eventType === "checkin"
          ? { checkin_override_requested: true }
          : { checkout_override_requested: true },
      )
      .eq("id", input.bookingId);
    const where =
      input.distance == null
        ? "Their phone couldn't share its location."
        : `Their phone put them about ${Math.round(input.distance)} metres from the home.`;
    await alertAdmins(
      "geofence_override",
      eventType === "checkin"
        ? "A cleaner asked you to accept their arrival"
        : "A cleaner asked you to accept that they have finished",
      `${where} Please decide whether to accept this or call them first.`,
      {
        booking_id: input.bookingId,
        "Rough distance":
          input.distance == null ? "No location shared" : `About ${Math.round(input.distance)} metres`,
      },
    );
  }
  return NextResponse.json({
    distance: input.distance,
    overrideRequested: true,
    success: true,
  });
}

/** Tell the customer their cleaner has set off (push + email). */
async function notifyCustomerEnRoute(bookingId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select(
      "customer_id,scheduled_date,scheduled_start_time,service_type,is_recurring,cleaner:profiles!bookings_cleaner_id_fkey(full_name),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
    )
    .eq("id", bookingId)
    .single();
  if (!data) return;
  const one = <T,>(value: T | T[] | null) =>
    Array.isArray(value) ? (value[0] ?? null) : value;
  const cleaner = one(data.cleaner as { full_name?: string | null } | null);
  const customer = one(
    data.customer as {
      email?: string | null;
      full_name?: string | null;
      notification_preferences?: { email?: boolean } | null;
    } | null,
  );
  const cleanerName = cleaner?.full_name?.split(" ")[0] || "Your cleaner";
  await sendPushNotification(
    data.customer_id,
    "Your cleaner is on the way",
    `${cleanerName} is on the way. You can follow them on the map in your booking.`,
    { booking_id: bookingId },
  );
  if (customer?.email && customer.notification_preferences?.email !== false) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendBrandedEmail({
      data: {
        appUrl,
        bookingId,
        bookingUrl: `${appUrl}/booking/${bookingId}`,
        cleanerName,
        firstName: customer.full_name?.split(" ")[0],
        scheduledDate: data.scheduled_date,
        scheduledTime: String(data.scheduled_start_time ?? "").slice(0, 5),
        serviceName: bookingServiceName(data as { is_recurring?: boolean | null; service_type: string }),
      },
      template: "customer.cleaner_en_route",
      to: customer.email,
    });
  }
}
