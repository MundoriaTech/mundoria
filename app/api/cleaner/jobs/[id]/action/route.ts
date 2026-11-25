import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateBookingGeofence } from "@/lib/bookings/geofence";
import { getDistanceInMetres } from "@/lib/maps/distance";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("status,address:addresses(latitude,longitude)")
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
  const eventType = booking.status === "in_progress" ? "checkout" : "checkin";
  const distance = getDistanceInMetres(
    latitude,
    longitude,
    Number(address.latitude),
    Number(address.longitude),
  );
  const { data: existing } = await admin
    .from("location_override_requests")
    .select("id")
    .eq("booking_id", params.id)
    .eq("cleaner_id", user.id)
    .eq("event_type", eventType)
    .eq("status", "pending")
    .maybeSingle();
  if (!existing) {
    await admin.from("location_override_requests").insert({
      booking_id: params.id,
      cleaner_id: user.id,
      distance_meters: distance,
      event_type: eventType,
      latitude,
      longitude,
      reason: parsed.data.reason ?? "Cleaner requested manual location review",
    });
    await admin
      .from("bookings")
      .update(
        eventType === "checkin"
          ? { checkin_override_requested: true }
          : { checkout_override_requested: true },
      )
      .eq("id", params.id);
    await alertAdmins(
      "geofence_override",
      eventType === "checkin"
        ? "A cleaner asked you to accept their arrival"
        : "A cleaner asked you to accept that they have finished",
      `Their phone put them about ${Math.round(distance)} metres from the home. Please decide whether to accept this or call them first.`,
      {
        booking_id: params.id,
        "Rough distance": `About ${Math.round(distance)} metres`,
      },
    );
  }
  return NextResponse.json({
    distance,
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
      "customer_id,scheduled_date,scheduled_start_time,service_type,cleaner:profiles!bookings_cleaner_id_fkey(full_name),customer:profiles!bookings_customer_id_fkey(email,full_name,notification_preferences)",
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
        serviceName: String(data.service_type).replaceAll("_", " "),
      },
      template: "customer.cleaner_en_route",
      to: customer.email,
    });
  }
}
