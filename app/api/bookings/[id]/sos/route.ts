import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unable to send the alert." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,status")
    .eq("id", params.id)
    .or(`customer_id.eq.${user.id},cleaner_id.eq.${user.id}`)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  const note = parsed.data.note?.trim();
  const body = note
    ? `Emergency on booking ${params.id.slice(0, 8)}. ${note}`
    : `Emergency on booking ${params.id.slice(0, 8)}.`;
  await alertAdmins("sos", "Emergency alert", body, {
    booking_id: params.id,
    reported_by: user.id,
  });
  const otherId =
    user.id === booking.customer_id ? booking.cleaner_id : booking.customer_id;
  if (otherId) {
    await sendPushNotification(
      otherId,
      "Emergency alert",
      "An emergency was raised on this booking. Mundoria has been told.",
      { booking_id: params.id },
    );
  }
  await admin.from("notifications").insert({
    body,
    data: { booking_id: params.id },
    title: "Emergency alert sent",
    type: "sos",
    user_id: user.id,
  });
  return NextResponse.json({ success: true });
}
