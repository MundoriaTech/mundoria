import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  amountPence: z.number().int().min(100).max(10000),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a tip amount." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,status,actual_end_time,tip_pence,updated_at")
    .eq("id", params.id)
    .eq("customer_id", user.id)
    .single();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (!["completed", "awaiting_customer_confirmation"].includes(booking.status)) {
    return NextResponse.json(
      { error: "You can tip once the clean has finished." },
      { status: 400 },
    );
  }
  const finishedAt = new Date(booking.actual_end_time ?? booking.updated_at);
  if (Date.now() - finishedAt.getTime() > 24 * 60 * 60 * 1000) {
    return NextResponse.json(
      { error: "Tips are open for 24 hours after the clean." },
      { status: 400 },
    );
  }
  if (Number(booking.tip_pence) > 0) {
    return NextResponse.json({ error: "A tip is already recorded." }, { status: 400 });
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: parsed.data.amountPence,
    payment_method_types: ["card"],
    currency: "gbp",
    metadata: {
      booking_id: params.id,
      kind: "tip",
      supabase_user_id: user.id,
    },
  });
  return NextResponse.json({ clientSecret: intent.client_secret });
}
