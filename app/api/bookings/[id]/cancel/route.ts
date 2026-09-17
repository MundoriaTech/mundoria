import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/recurring";
import { refundBookingPayment } from "@/lib/payments/service";
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

  const hoursLeft = hoursUntilBookingStart(
    booking.scheduled_date,
    String(booking.scheduled_start_time).slice(0, 5),
  );
  if (
    hoursLeft < 0 ||
    !["pending_match", "matched", "confirmed"].includes(booking.status)
  ) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled online." },
      { status: 400 },
    );
  }

  const total = Number(booking.amount_total ?? 0);
  const fee = cancellationFeePence({
    amountTotal: total,
    hoursUntilStart: hoursLeft,
  });
  const refundAmount = Math.max(0, total - fee);

  if (booking.stripe_payment_intent_id) {
    try {
      if (refundAmount > 0) {
        await refundBookingPayment(params.id, refundAmount);
      } else if (fee >= total && total > 0) {
        // Keep full amount: capture held auth, or leave succeeded charge as-is.
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id,
        );
        if (intent.status === "requires_capture") {
          await stripe.paymentIntents.capture(intent.id);
        }
      } else {
        await refundBookingPayment(params.id);
      }
    } catch {
      return NextResponse.json(
        { error: "Unable to process cancellation payment." },
        { status: 400 },
      );
    }
  }

  const paymentStatus =
    fee >= total && total > 0 ? "released" : "refunded";

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      cancellation_reason: parsed.data.reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      payment_status: paymentStatus,
      status: "cancelled",
    })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from("notifications").insert({
    body:
      fee > 0
        ? `Cancelled. Cancellation fee £${(fee / 100).toFixed(2)}; £${(refundAmount / 100).toFixed(2)} refunded.`
        : "Your payment has been refunded in full.",
    data: {
      booking_id: params.id,
      cancellation_fee_pence: fee,
      refund_pence: refundAmount,
    },
    title: "Booking cancelled",
    type: "booking_cancelled",
    user_id: user.id,
  });

  return NextResponse.json({
    cancellationFeePence: fee,
    refundPence: refundAmount,
    success: true,
  });
}
