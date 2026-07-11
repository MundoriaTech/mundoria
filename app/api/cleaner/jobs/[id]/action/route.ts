import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateBookingGeofence } from "@/lib/bookings/geofence";
import { getDistanceInMetres } from "@/lib/maps/distance";
import { alertAdmins } from "@/lib/notifications/admin";
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
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
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
    if (!["matched", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        { error: `This job cannot start from ${booking.status}.` },
        { status: 409 },
      );
    }
    await admin
      .from("bookings")
      .update({ status: "cleaner_en_route" })
      .eq("id", params.id)
      .eq("cleaner_id", user.id);
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
      "Manual location review requested",
      `Cleaner requested a ${eventType} override from ${Math.round(distance)}m away.`,
      { booking_id: params.id, cleaner_id: user.id, event_type: eventType },
    );
  }
  return NextResponse.json({
    distance,
    overrideRequested: true,
    success: true,
  });
}
