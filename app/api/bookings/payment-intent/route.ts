import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

import {
  frequencyAllowsOneOff,
  pricingServiceTypeFor,
} from "@/lib/customer/booking-flow";
import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { resolvePromoForCheckout } from "@/lib/customer/referrals";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { estimatePrice } from "@/lib/customer/services";
import {
  confirmBookingSetupIntentWithSavedCard,
  createBookingSetupIntent,
} from "@/lib/payments/lifecycle";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Address } from "@/types/customer";

export async function POST(request: Request) {
  const parsed = bookingDraftSchema.safeParse(await request.json());

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
      { error: "Workspace cleaning needs a repeat schedule." },
      { status: 400 },
    );
  }

  const { supabase, user } = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const [{ data: address }, { data: profile }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("id", parsed.data.addressId)
      .eq("customer_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email, phone, stripe_customer_id, role")
      .eq("id", user.id)
      .single(),
  ]);

  if (!address || !profile) {
    return NextResponse.json(
      { error: "Address or customer profile not found" },
      { status: 404 },
    );
  }

  if (profile.role !== "customer") {
    return NextResponse.json(
      {
        error:
          "Only customer accounts can book. Use a customer account, separate from your cleaner login.",
      },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  let promo: {
    discount_type: "fixed" | "percentage";
    discount_value: number;
    id: string;
  } | null = null;

  if (parsed.data.promoCode) {
    try {
      promo = await resolvePromoForCheckout({
        code: parsed.data.promoCode,
        customerId: user.id,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "That promo code is invalid or has expired.",
        },
        { status: 400 },
      );
    }
  }

  const pricing = await loadServicePricing();
  const pricedAddress = address as Address;
  const pricedServiceType =
    pricingServiceTypeFor({
      frequencyChosen: true,
      isRecurring: parsed.data.isRecurring,
      serviceType: parsed.data.serviceType,
    }) ?? parsed.data.serviceType;
  const baseAmount = estimatePrice(
    pricedServiceType,
    pricedAddress,
    parsed.data.cleaningStandard,
    parsed.data.selectedAddOns,
    {
      date: parsed.data.scheduledDate,
      time: parsed.data.scheduledTime,
    },
    {
      durationHours: parsed.data.estimatedDurationHours,
      officeSpaces: parsed.data.officeSpaces,
      pricing,
      rooms: {
        bathrooms: parsed.data.numBathrooms,
        bedrooms: parsed.data.numBedrooms,
        otherRooms: parsed.data.otherRoomTypes?.length ?? null,
      },
    },
  );
  const discount = promo
    ? promo.discount_type === "percentage"
      ? Math.round(baseAmount * (promo.discount_value / 100))
      : Math.round(promo.discount_value)
    : 0;
  const amount = Math.max(100, baseAmount - discount);
  const stripe = getStripe();
  let stripeCustomerId = profile.stripe_customer_id as string | null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: user.id },
      name: profile.full_name,
      phone: profile.phone ?? undefined,
    });
    stripeCustomerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", user.id);
  }

  const metadata = {
    address_id: parsed.data.addressId,
    cleaning_standard: parsed.data.cleaningStandard,
    promo_code_id: promo?.id ?? "",
    scheduled_date: parsed.data.scheduledDate,
    scheduled_time: parsed.data.scheduledTime,
    selected_add_ons: parsed.data.selectedAddOns.join(","),
    service_type: parsed.data.serviceType,
  };

  const baseIdempotency = [
    user.id,
    parsed.data.addressId,
    parsed.data.serviceType,
    parsed.data.scheduledDate,
    parsed.data.scheduledTime,
    String(amount),
    parsed.data.selectedAddOns.slice().sort().join("-") || "none",
  ].join("_");

  if (parsed.data.paymentMethodId) {
    try {
      const setupIntent = await confirmBookingSetupIntentWithSavedCard({
        amount,
        customerId: user.id,
        idempotencyKey: `reuse_${parsed.data.paymentMethodId}_${baseIdempotency}`,
        metadata,
        paymentMethodId: parsed.data.paymentMethodId,
        stripeCustomerId,
      });
      if (setupIntent.status !== "succeeded" || !setupIntent.id) {
        return NextResponse.json(
          {
            error:
              "That saved card needs another check. Please use a different card or try again.",
            clientSecret: setupIntent.client_secret,
            requiresAction: true,
            setupIntentId: setupIntent.id,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({
        amount,
        confirmed: true,
        promoCodeId: promo?.id ?? null,
        setupIntentId: setupIntent.id,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to use that saved card.",
        },
        { status: 400 },
      );
    }
  }

  const setupIntent = await createBookingSetupIntent({
    amount,
    customerId: user.id,
    idempotencyKey: `setup_${baseIdempotency}`,
    metadata,
    stripeCustomerId,
  });

  return NextResponse.json({
    amount,
    clientSecret: setupIntent.client_secret,
    promoCodeId: promo?.id ?? null,
    setupIntentId: setupIntent.id,
  });
}
