import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { differenceInHours } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const schema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please include a cancellation reason." },
      { status: 400 },
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .eq("customer_id", user.id)
    .single();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const scheduledAt = new Date(
    `${booking.scheduled_date}T${booking.scheduled_start_time}`,
  );
  if (
    differenceInHours(scheduledAt, new Date()) <= 6 ||
    !["pending_match", "matched", "confirmed"].includes(booking.status)
  ) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled online." },
      { status: 400 },
    );
  }

  if (booking.stripe_payment_intent_id) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id,
    );
    if (!["canceled", "succeeded"].includes(intent.status)) {
      await stripe.paymentIntents.cancel(intent.id);
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      cancellation_reason: parsed.data.reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      payment_status: "refunded",
      status: "cancelled",
    })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from("notifications").insert({
    body: "Your payment authorization has been voided.",
    data: { booking_id: params.id },
    title: "Booking cancelled",
    type: "booking_cancelled",
    user_id: user.id,
  });

  return NextResponse.json({ success: true });
}
