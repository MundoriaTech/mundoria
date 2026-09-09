import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import twilio from "twilio";

import { createBookingSchema } from "@/lib/customer/booking-schema";
import {
  formatMoney,
  formatServiceName,
  SERVICE_ADD_ONS,
} from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
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
  const metadataAddOns = (paymentIntent.metadata.selected_add_ons ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
    .join(",");
  const requestAddOns = [...parsed.data.selectedAddOns].sort().join(",");

  if (
    paymentIntent.metadata.supabase_user_id !== user.id ||
    paymentIntent.metadata.address_id !== parsed.data.addressId ||
    paymentIntent.metadata.service_type !== parsed.data.serviceType ||
    (paymentIntent.metadata.cleaning_standard &&
      paymentIntent.metadata.cleaning_standard !== parsed.data.cleaningStandard) ||
    (paymentIntent.metadata.selected_add_ons !== undefined &&
      metadataAddOns !== requestAddOns) ||
    paymentIntent.status !== "succeeded"
  ) {
    return NextResponse.json(
      { error: "Payment could not be verified." },
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

  const selectedAddOnDefs = SERVICE_ADD_ONS.filter((addOn) =>
    parsed.data.selectedAddOns.includes(addOn.id),
  );
  const platformAmount = Math.round(paymentIntent.amount * 0.2);
  const cleanerAmount = paymentIntent.amount - platformAmount;
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      address_id: parsed.data.addressId,
      amount_cleaner: cleanerAmount,
      amount_platform: platformAmount,
      amount_total: paymentIntent.amount,
      cleaning_standard: parsed.data.cleaningStandard,
      customer_id: user.id,
      estimated_duration_hours: parsed.data.estimatedDurationHours,
      is_recurring: parsed.data.isRecurring,
      payment_status: "released",
      promo_code_id: paymentIntent.metadata.promo_code_id || null,
      prefer_same_cleaner:
        parsed.data.isRecurring && parsed.data.preferSameCleaner,
      property_condition: parsed.data.propertyCondition,
      recently_moved: parsed.data.recentlyMoved,
      recommendation_outcome: parsed.data.recommendationOutcome,
      recommended_cleaning_standard: parsed.data.recommendedCleaningStandard,
      recommended_service_type: parsed.data.recommendedServiceType,
      recurrence_pattern: parsed.data.isRecurring
        ? parsed.data.recurrencePattern
        : null,
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: parsed.data.scheduledTime,
      service_category: parsed.data.serviceCategory,
      service_type: parsed.data.serviceType,
      special_attention_areas: parsed.data.specialAttentionAreas,
      special_instructions: parsed.data.specialInstructions || null,
      status: "pending_match",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select()
    .single();

  if (error) {
    if (paymentIntent.status === "succeeded") {
      await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        reason: "requested_by_customer",
      });
    } else if (!["canceled", "succeeded"].includes(paymentIntent.status)) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (selectedAddOnDefs.length) {
    const { error: addOnError } = await admin.from("booking_add_ons").insert(
      selectedAddOnDefs.map((addOn) => ({
        add_on_id: addOn.id,
        amount: addOn.amount,
        booking_id: booking.id,
        label: addOn.label,
      })),
    );

    if (addOnError) {
      Sentry.captureException(addOnError);
      await admin.from("bookings").delete().eq("id", booking.id);
      if (paymentIntent.status === "succeeded") {
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: "requested_by_customer",
        });
      } else if (!["canceled", "succeeded"].includes(paymentIntent.status)) {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      }
      return NextResponse.json(
        { error: "Unable to save booking add-ons." },
        { status: 400 },
      );
    }
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
  const message = `Your CleanScape booking is confirmed for ${parsed.data.scheduledDate} at ${parsed.data.scheduledTime}. Your card has been charged ${formatMoney(paymentIntent.amount)}.`;
  const preferences = profile.notification_preferences as {
    email?: boolean;
    sms?: boolean;
  };

  try {
    if (preferences.email !== false && process.env.RESEND_API_KEY) {
      await sendBrandedEmail({
        data: {
          address: `${address.address_line_1}, ${address.city}, ${address.postcode}`,
          amount: formatMoney(paymentIntent.amount),
          appUrl,
          bookingId: booking.id,
          bookingUrl: `${appUrl}/booking/${booking.id}`,
          firstName: profile.full_name?.split(" ")[0],
          fullName: profile.full_name,
          scheduledDate: parsed.data.scheduledDate,
          scheduledTime: parsed.data.scheduledTime,
          serviceName: formatServiceName(parsed.data.serviceType),
        },
        template: "customer.booking_confirmed",
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
