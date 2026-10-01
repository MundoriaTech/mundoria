import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/recurring";
import { canCustomerChangeSchedule } from "@/lib/bookings/schedule";
import { sendBrandedEmail } from "@/lib/email/send-email";
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
    !canCustomerChangeSchedule({
      actualStartTime: booking.actual_start_time,
      checkinVerified: booking.checkin_verified,
      scheduledDate: booking.scheduled_date,
      scheduledStartTime: String(booking.scheduled_start_time).slice(0, 5),
      status: booking.status,
    })
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

  if (booking.cleaner_id) {
    const { data: cleaner } = await admin
      .from("profiles")
      .select("email,full_name,notification_preferences")
      .eq("id", booking.cleaner_id)
      .maybeSingle();
    const preferences = cleaner?.notification_preferences as
      | { email?: boolean }
      | null;
    await admin.from("notifications").insert({
      body: "The customer cancelled this visit.",
      data: { booking_id: params.id },
      title: "Job cancelled",
      type: "job_cancelled",
      user_id: booking.cleaner_id,
    });
    if (cleaner?.email && preferences?.email !== false) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendBrandedEmail({
        data: {
          appUrl,
          bookingId: params.id,
          jobUrl: `${appUrl}/cleaner/jobs`,
          reason: parsed.data.reason,
          scheduledDate: booking.scheduled_date,
          scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
        },
        template: "cleaner.job_cancelled",
        to: cleaner.email,
      });
    }
  }

  return NextResponse.json({
    cancellationFeePence: fee,
    refundPence: refundAmount,
    success: true,
  });
}
