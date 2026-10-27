import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/recurring";
import { canCustomerChangeSchedule } from "@/lib/bookings/schedule";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { changePro, cancelSeriesVisits } from "@/lib/bookings/series-actions";
import { refundBookingPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const schema = z.object({
  reason: z.string().trim().min(3).max(500),
  scope: z.enum(["visit", "series"]).default("visit"),
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

  const { supabase, user } = await getRequestUser(request);
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

  if (/another pro|different pro|change pro/i.test(parsed.data.reason)) {
    try {
      await changePro({ bookingId: params.id, customerId: user.id });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to change pro." },
        { status: 400 },
      );
    }
    return NextResponse.json({ changedPro: true, success: true });
  }

  if (parsed.data.scope === "series" && booking.is_recurring) {
    try {
      const result = await cancelSeriesVisits({
        bookingId: params.id,
        customerId: user.id,
        reason: parsed.data.reason,
      });
      return NextResponse.json({ ...result, success: true });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to cancel the series." },
        { status: 400 },
      );
    }
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
  let paymentStatus: "unpaid" | "held" | "released" | "refunded" =
    booking.payment_status;

  if (booking.stripe_payment_intent_id) {
    try {
      if (fee <= 0) {
        await refundBookingPayment(params.id);
        paymentStatus = "refunded";
      } else if (refundAmount > 0) {
        await refundBookingPayment(params.id, refundAmount);
        paymentStatus = fee >= total ? "released" : "refunded";
      } else if (fee >= total && total > 0) {
        // Keep full amount: capture held auth, or leave succeeded charge as-is.
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id,
        );
        if (intent.status === "requires_capture") {
          await stripe.paymentIntents.capture(intent.id);
        }
        paymentStatus = "released";
      } else {
        await refundBookingPayment(params.id);
        paymentStatus = "refunded";
      }
    } catch {
      return NextResponse.json(
        { error: "Unable to process cancellation payment." },
        { status: 400 },
      );
    }
  } else if (fee > 0 && booking.stripe_payment_method_id) {
    // No hold yet — charge the cancellation fee off-session from the saved card.
    try {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();
      if (!profile?.stripe_customer_id) {
        throw new Error("Missing Stripe customer");
      }
      const intent = await getStripe().paymentIntents.create(
        {
          amount: fee,
          confirm: true,
          currency: "gbp",
          customer: profile.stripe_customer_id,
          metadata: {
            booking_id: params.id,
            cancellation_fee: "true",
            supabase_user_id: user.id,
          },
          off_session: true,
          payment_method: booking.stripe_payment_method_id,
        },
        { idempotencyKey: `cancel_fee_${params.id}_${fee}`.slice(0, 255) },
      );
      if (intent.status !== "succeeded") {
        throw new Error(`Cancellation fee status ${intent.status}`);
      }
      paymentStatus = "released";
      await adminClient
        .from("bookings")
        .update({ stripe_payment_intent_id: intent.id })
        .eq("id", params.id);
    } catch {
      return NextResponse.json(
        { error: "Unable to process cancellation payment." },
        { status: 400 },
      );
    }
  } else if (fee <= 0) {
    paymentStatus =
      booking.payment_status === "held" ? "refunded" : booking.payment_status;
  }

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
        : booking.stripe_payment_intent_id
          ? "Your payment has been refunded in full."
          : "Your booking was cancelled. No charge was taken.",
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
