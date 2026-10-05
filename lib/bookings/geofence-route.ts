import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateBookingGeofence } from "@/lib/bookings/geofence";

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function handleGeofenceRequest(
  request: Request,
  bookingId: string,
  action: "checkin" | "checkout",
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid coordinates required" }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await validateBookingGeofence({
      action,
      bookingId,
      cleanerId: user.id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });
    return NextResponse.json(
      result.valid
        ? result
        : {
            ...result,
            error: `Outside the ${result.radius}m geofence.`,
          },
      { status: result.valid ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 400 },
    );
  }
}
