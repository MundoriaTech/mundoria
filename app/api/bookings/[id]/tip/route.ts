import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { recordTipPayment, TIP_MAX_PENCE, TIP_MIN_PENCE } from "@/lib/payments/tips";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  amountPence: z.number().int().min(TIP_MIN_PENCE).max(TIP_MAX_PENCE),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a tip between £1 and £100." },
      { status: 400 },
    );
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,status,actual_end_time,tip_pence,updated_at,stripe_payment_method_id")
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
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!booking.stripe_payment_method_id || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "There's no saved card on this booking to tip with." },
      { status: 400 },
    );
  }

  // Charge the card saved at booking; the customer is here, so if their
  // bank wants to check, the page shows that step instead of a card form.
  let intent: Stripe.PaymentIntent;
  try {
    intent = await getStripe().paymentIntents.create(
      {
        amount: parsed.data.amountPence,
        confirm: true,
        currency: "gbp",
        customer: profile.stripe_customer_id,
        description: "Tip for your Mundoria cleaner",
        metadata: { booking_id: params.id, kind: "tip", supabase_user_id: user.id },
        payment_method: booking.stripe_payment_method_id,
        payment_method_types: ["card"],
      },
      { idempotencyKey: `tip_${params.id}_${parsed.data.amountPence}`.slice(0, 255) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Your card was declined." },
      { status: 402 },
    );
  }

  if (intent.status === "succeeded") {
    const tipPence = await recordTipPayment({
      bookingId: params.id,
      customerId: user.id,
      intent,
    });
    return NextResponse.json({ success: true, tipPence });
  }
  if (intent.status === "requires_action" && intent.client_secret) {
    return NextResponse.json({ clientSecret: intent.client_secret, requiresAction: true });
  }
  return NextResponse.json({ error: "The tip wasn't taken. Try again." }, { status: 402 });
}
