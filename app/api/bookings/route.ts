import { getRequestUser } from "@/lib/supabase/request-client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import twilio from "twilio";

import { trackUserActivity } from "@/lib/analytics/user-activity";
import { frequencyAllowsOneOff } from "@/lib/customer/booking-flow";
import { createBookingSchema } from "@/lib/customer/booking-schema";
import { calculateOfficeQuote } from "@/lib/customer/office-pricing";
import {
  addOnAmountPence,
  formatMoney,
  formatServiceName,
  SERVICE_ADD_ONS,
} from "@/lib/customer/services";
import { createRecurringFollowOnBookings } from "@/lib/bookings/recurring";
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

  if (
    !frequencyAllowsOneOff(parsed.data.serviceType) &&
    !parsed.data.isRecurring
  ) {
    return NextResponse.json(
      { error: "This service needs a repeat schedule." },
      { status: 400 },
    );
  }

  const { user } = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: roleProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleProfile?.role !== "customer") {
    return NextResponse.json(
      {
        error:
          "Only customer accounts can create bookings. Sign in with a customer account, or create one separately from your cleaner account.",
      },
      { status: 403 },
    );
  }

  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.retrieve(
    parsed.data.setupIntentId,
    { expand: ["payment_method"] },
  );
  const metadata = setupIntent.metadata ?? {};
  const metadataAddOns = (metadata.selected_add_ons ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
    .join(",");
  const requestAddOns = [...parsed.data.selectedAddOns].sort().join(",");
  const amountPence = Number(metadata.amount_pence ?? 0);
  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id ?? null;

  if (
    metadata.supabase_user_id !== user.id ||
    metadata.address_id !== parsed.data.addressId ||
    metadata.service_type !== parsed.data.serviceType ||
    (metadata.cleaning_standard &&
      metadata.cleaning_standard !== parsed.data.cleaningStandard) ||
    (metadata.selected_add_ons !== undefined &&
      metadataAddOns !== requestAddOns) ||
    setupIntent.status !== "succeeded" ||
    !paymentMethodId ||
    amountPence < 100
  ) {
    return NextResponse.json(
      { error: "Payment method could not be verified." },
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
  const platformAmount = Math.round(amountPence * 0.2);
  const cleanerAmount = amountPence - platformAmount;
  const officeQuote =
    parsed.data.serviceType === "office" && parsed.data.officeSpaces.length
      ? calculateOfficeQuote(
          parsed.data.officeSpaces,
          parsed.data.cleaningStandard,
        )
      : null;

  let preferredCleanerId: string | null = null;
  if (parsed.data.preferSameCleaner && parsed.data.preferredCleanerId) {
    const { data: pastWithCleaner } = await admin
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .eq("cleaner_id", parsed.data.preferredCleanerId)
      .limit(1)
      .maybeSingle();
    if (pastWithCleaner) {
      preferredCleanerId = parsed.data.preferredCleanerId;
    }
  }

  // Idempotent: same SetupIntent must never create a second booking.
  const { data: existingBooking } = await admin
    .from("bookings")
    .select("id")
    .eq("stripe_setup_intent_id", setupIntent.id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (existingBooking) {
    return NextResponse.json({
      bookingId: existingBooking.id,
      matching: { matched: false },
      reused: true,
    });
  }

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      address_id: parsed.data.addressId,
      allocated_cleaners: officeQuote?.allocatedCleaners ?? 1,
      amount_cleaner: cleanerAmount,
      amount_platform: platformAmount,
      amount_total: amountPence,
      cleaner_hours: officeQuote?.cleanerHours ?? null,
      cleaning_standard: parsed.data.cleaningStandard,
      commercial_spaces: officeQuote ? parsed.data.officeSpaces : null,
      customer_id: user.id,
      estimated_duration_hours: parsed.data.estimatedDurationHours,
      is_recurring: parsed.data.isRecurring,
      payment_status: "unpaid",
      promo_code_id: metadata.promo_code_id || null,
      prefer_same_cleaner: Boolean(preferredCleanerId),
      preferred_cleaner_id: preferredCleanerId,
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
      stripe_payment_method_id: paymentMethodId,
      stripe_setup_intent_id: setupIntent.id,
    })
    .select()
    .single();

  if (error) {
    const { data: raced } = await admin
      .from("bookings")
      .select("id")
      .eq("stripe_setup_intent_id", setupIntent.id)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (raced) {
      return NextResponse.json({
        bookingId: raced.id,
        matching: { matched: false },
        reused: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let recurringError: string | null = null;
  if (parsed.data.isRecurring) {
    try {
      const followOnIds = await createRecurringFollowOnBookings({
        admin,
        customDates: parsed.data.customRecurrenceDates ?? [],
        parent: booking,
        pattern: parsed.data.recurrencePattern,
      });
      for (const followOnId of followOnIds) {
        try {
          await runMatchingEngine(followOnId);
        } catch (matchError) {
          Sentry.captureException(matchError);
        }
      }
    } catch (seriesError) {
      Sentry.captureException(seriesError);
      recurringError =
        seriesError instanceof Error
          ? seriesError.message
          : "The next visit in this series could not be created.";
      await admin.from("notifications").insert({
        body: "Your first visit is booked. The next visit in the series could not be created yet — contact support if it does not appear in your bookings.",
        data: { booking_id: booking.id },
        title: "Recurring visit needs attention",
        type: "booking_created",
        user_id: user.id,
      });
    }
  }

  if (selectedAddOnDefs.length) {
    const supplyHours =
      officeQuote?.cleanerHours ?? parsed.data.estimatedDurationHours ?? 0;
    const { error: addOnError } = await admin.from("booking_add_ons").insert(
      selectedAddOnDefs.map((addOn) => ({
        add_on_id: addOn.id,
        amount: addOnAmountPence(addOn, {
          durationHours: supplyHours,
          serviceType: parsed.data.serviceType,
          standard: parsed.data.cleaningStandard,
        }),
        booking_id: booking.id,
        label: addOn.label,
      })),
    );

    if (addOnError) {
      Sentry.captureException(addOnError);
      await admin.from("bookings").delete().eq("id", booking.id);
      return NextResponse.json(
        {
          error:
            "Unable to save booking add-ons. Please try again without add-ons, or contact support.",
          details: addOnError.message,
        },
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

  if (metadata.promo_code_id) {
    const { data: promo } = await admin
      .from("promo_codes")
      .select("uses_count")
      .eq("id", metadata.promo_code_id)
      .single();
    if (promo) {
      await admin
        .from("promo_codes")
        .update({ uses_count: promo.uses_count + 1 })
        .eq("id", metadata.promo_code_id);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const message = `Your Mundoria booking is confirmed for ${parsed.data.scheduledDate} at ${parsed.data.scheduledTime}. Card saved for ${formatMoney(amountPence)} — we hold funds about 24 hours before your clean, then charge the next day after it’s done.`;
  const preferences = profile.notification_preferences as {
    email?: boolean;
    sms?: boolean;
  };

  try {
    if (preferences.email !== false && process.env.RESEND_API_KEY) {
      await sendBrandedEmail({
        data: {
          address: `${address.address_line_1}, ${address.city}, ${address.postcode}`,
          amount: formatMoney(amountPence),
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

  await trackUserActivity({
    eventName: "booking_created",
    metadata: {
      bookingId: booking.id,
      serviceType: parsed.data.serviceType,
    },
    path: "/booking/new",
    userId: user.id,
  });

  return NextResponse.json({
    bookingId: booking.id,
    matching,
    recurringError,
  });
}
