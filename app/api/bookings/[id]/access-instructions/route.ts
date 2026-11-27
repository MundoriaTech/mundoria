import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  instructions: z.string().trim().max(1000),
});

/** Statuses where the visit hasn't finished, so access notes still help. */
const EDITABLE = [
  "pending_match",
  "matched",
  "awaiting_payment",
  "confirmed",
  "cleaner_en_route",
  "in_progress",
];

/** The customer adds or changes how the cleaner gets in. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Keep access instructions under 1,000 characters." },
      { status: 400 },
    );
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to update this booking." }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,status,scheduled_date,access_instructions")
    .eq("id", params.id)
    .maybeSingle();
  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (!EDITABLE.includes(booking.status)) {
    return NextResponse.json(
      { error: "This visit has finished, so its access instructions can't be changed." },
      { status: 409 },
    );
  }
  const instructions = parsed.data.instructions || null;
  if (instructions === (booking.access_instructions ?? null)) {
    return NextResponse.json({ instructions });
  }
  const { error } = await admin
    .from("bookings")
    .update({ access_instructions: instructions })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // The assigned cleaner hears straight away; a cleaner assigned later sees
  // the instructions on the job page.
  if (booking.cleaner_id) {
    await sendPushNotification(
      booking.cleaner_id as string,
      "Access instructions updated",
      instructions
        ? `For your visit on ${booking.scheduled_date}: ${instructions.slice(0, 140)}`
        : `The customer removed the access instructions for ${booking.scheduled_date}.`,
      { booking_id: params.id },
    ).catch(() => undefined);
  }
  return NextResponse.json({ instructions });
}
