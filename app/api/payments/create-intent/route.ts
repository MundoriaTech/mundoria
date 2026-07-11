import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createManualPaymentIntent } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  amount: z.number().int().min(100).optional(),
  booking_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid booking and amount required" }, { status: 400 });
  }
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: booking }, { data: profile }] = await Promise.all([
    admin
      .from("bookings")
      .select("customer_id,amount_total")
      .eq("id", parsed.data.booking_id)
      .single(),
    admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single(),
  ]);
  if (booking?.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const amount = booking.amount_total ?? parsed.data.amount;
  if (!amount || amount < 100) {
    return NextResponse.json(
      { error: "Booking amount must be at least £1.00" },
      { status: 400 },
    );
  }
  const intent = await createManualPaymentIntent({
    amount,
    bookingId: parsed.data.booking_id,
    customerId: user.id,
    stripeCustomerId: profile?.stripe_customer_id,
  });
  return NextResponse.json({
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
  });
}
