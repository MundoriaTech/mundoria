import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid coordinates required" }, { status: 400 });
  }
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status")
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .single();
  if (booking?.status !== "cleaner_en_route") {
    return NextResponse.json(
      { error: "Location updates require en-route status." },
      { status: 409 },
    );
  }
  const now = new Date().toISOString();
  const { error } = await admin.from("cleaner_locations").upsert({
    booking_id: params.id,
    cleaner_id: user.id,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    updated_at: now,
  });
  if (!error) {
    await admin
      .from("bookings")
      .update({
        cleaner_live_latitude: parsed.data.latitude,
        cleaner_live_longitude: parsed.data.longitude,
        cleaner_location_updated_at: now,
      })
      .eq("id", params.id);
  }
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ success: true, updated_at: now });
}
