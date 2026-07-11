import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import twilio from "twilio";

import { createBookingSchema } from "@/lib/customer/booking-schema";
import {
  formatMoney,
  formatServiceName,
  serviceDefinition,
} from "@/lib/customer/services";
import { runMatchingEngine } from "@/lib/matching/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const parsed = createBookingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking details" },
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

  const admin = createAdminClient();
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    parsed.data.paymentIntentId,
  );

  if (
    paymentIntent.metadata.supabase_user_id !== user.id ||
    paymentIntent.metadata.address_id !== parsed.data.addressId ||
    paymentIntent.metadata.service_type !== parsed.data.serviceType ||
    !["requires_capture", "requires_confirmation"].includes(paymentIntent.status)
  ) {
    return NextResponse.json(
      { error: "Payment authorization could not be verified." },
      { status: 400 },
    );
  }

  const [{ data: address }, { data: profile }] = await Promise.all([
    admin
      .from("addresses")
      .select("*")
      .eq("id", parsed.data.addressId)
      .eq("customer_id", user.id)
      .single(),
    admin
      .from("profiles")
      .select("full_name, email, phone, notification_preferences")
      .eq("id", user.id)
      .single(),
  ]);

  if (!address || !profile) {
    return NextResponse.json({ error: "Booking details not found" }, { status: 404 });
  }

  const platformAmount = Math.round(paymentIntent.amount * 0.2);
  const cleanerAmount = paymentIntent.amount - platformAmount;
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      address_id: parsed.data.addressId,
      amount_cleaner: cleanerAmount,
      amount_platform: platformAmount,
      amount_total: paymentIntent.amount,
      customer_id: user.id,
      estimated_duration_hours: serviceDefinition(parsed.data.serviceType).duration,
      is_recurring: parsed.data.isRecurring,
      payment_status: "held",
      promo_code_id: paymentIntent.metadata.promo_code_id || null,
      prefer_same_cleaner:
        parsed.data.isRecurring && parsed.data.preferSameCleaner,
      recurrence_pattern: parsed.data.isRecurring
        ? parsed.data.recurrencePattern
        : null,
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: parsed.data.scheduledTime,
      service_type: parsed.data.serviceType,
      special_instructions: parsed.data.specialInstructions || null,
      status: "pending_match",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select()
    .single();

  if (error) {
    if (!["canceled", "succeeded"].includes(paymentIntent.status)) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from("notifications").insert({
    body: `Your ${formatServiceName(parsed.data.serviceType)} is booked for ${parsed.data.scheduledDate} at ${parsed.data.scheduledTime}.`,
    data: { booking_id: booking.id },
    title: "Booking confirmed",
    type: "booking_created",
    user_id: user.id,
  });

  if (paymentIntent.metadata.promo_code_id) {
    const { data: promo } = await admin
      .from("promo_codes")
      .select("uses_count")
      .eq("id", paymentIntent.metadata.promo_code_id)
      .single();
    if (promo) {
      await admin
        .from("promo_codes")
        .update({ uses_count: promo.uses_count + 1 })
        .eq("id", paymentIntent.metadata.promo_code_id);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const message = `Your CleanScape booking is confirmed for ${parsed.data.scheduledDate} at ${parsed.data.scheduledTime}. Your card is authorized for ${formatMoney(paymentIntent.amount)} and will only be captured after completion.`;
  const preferences = profile.notification_preferences as {
    email?: boolean;
    sms?: boolean;
  };

  try {
    if (preferences.email !== false && process.env.RESEND_API_KEY) {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ??
          "CleanScape <onboarding@resend.dev>",
        html: `<h1>Booking confirmed</h1><p>${message}</p><p><a href="${appUrl}/booking/${booking.id}">View booking</a></p>`,
        subject: "Your CleanScape booking is confirmed",
        to: profile.email,
      });
    }

    if (
      preferences.sms !== false &&
      profile.phone &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ) {
      await twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      ).messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: profile.phone,
      });
    }
  } catch (notificationError) {
    Sentry.captureException(notificationError);
  }

  let matching: { matched: boolean; cleanerId?: string } = { matched: false };
  try {
    const result = await runMatchingEngine(booking.id);
    matching = {
      cleanerId: result.matched ? result.cleanerId : undefined,
      matched: result.matched,
    };
  } catch (matchingError) {
    Sentry.captureException(matchingError);
  }

  return NextResponse.json({ bookingId: booking.id, matching });
}
