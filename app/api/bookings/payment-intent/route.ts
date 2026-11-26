import {
  ADDRESS_NEEDS_STREET_MESSAGE,
  addressHasStreet,
} from "@/lib/customer/address-completeness";
import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";

import {
  frequencyAllowsOneOff,
  pricingServiceTypeFor,
} from "@/lib/customer/booking-flow";
import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { resolvePromoForCheckout } from "@/lib/customer/referrals";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import {
  PERCENT_OFFER_KIND,
  percentOfferDiscountPence,
} from "@/lib/bookings/percent-offer";
import {
  resolveFirstVisitOffer,
  resolvePercentOffer,
} from "@/lib/bookings/redeem-first-visit-offer";
import {
  estimatePriceBreakdown,
  isOfferedService,
  serviceDefinition,
} from "@/lib/customer/services";
import {
  confirmBookingSetupIntentWithSavedCard,
  createBookingSetupIntent,
} from "@/lib/payments/lifecycle";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Address } from "@/types/customer";
import { BOOKING_MIN_LEAD_HOURS, hoursFromNow } from "@/lib/bookings/lead-time";

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

  // Same notice the booking form asks for; stops an old or edited request
  // booking a clean sooner than that.
  if (
    hoursFromNow(parsed.data.scheduledDate, parsed.data.scheduledTime) <
    BOOKING_MIN_LEAD_HOURS
  ) {
    return NextResponse.json(
      {
        error: `Choose a time at least ${BOOKING_MIN_LEAD_HOURS} hours from now.`,
      },
      { status: 400 },
    );
  }

  try {
    if (!isOfferedService(serviceDefinition(parsed.data.serviceType))) {
      return NextResponse.json(
        { error: "This service is no longer available to book." },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "This service is no longer available to book." },
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

  // Saved addresses from before this check may lack a house number/street.
  if (!addressHasStreet(address)) {
    return NextResponse.json(
      {
        error: `${ADDRESS_NEEDS_STREET_MESSAGE} Update the address in your booking, then try again.`,
      },
      { status: 400 },
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
  // 20% off the first clean (Meta page) replaces the free hour; never both.
  const percentOffer = await resolvePercentOffer({
    admin,
    customerId: user.id,
    email: profile.email,
    phone: profile.phone,
  });
  const offer = percentOffer ? null : await resolveFirstVisitOffer({
    admin,
    customerId: user.id,
    durationHours: parsed.data.estimatedDurationHours,
    email: profile.email,
    phone: profile.phone,
    serviceType: pricedServiceType,
  });
  const breakdown = estimatePriceBreakdown(
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
      offerFreeHours: offer?.freeHours ?? 0,
      officeSpaces: parsed.data.officeSpaces,
      pricing,
      rooms: {
        bathrooms: parsed.data.numBathrooms,
        bedrooms: parsed.data.numBedrooms,
        otherRooms: parsed.data.otherRoomTypes?.length ?? null,
      },
    },
  );
  const baseAmount = breakdown.totalPence;
  const promoDiscount = promo
    ? promo.discount_type === "percentage"
      ? Math.round(baseAmount * (promo.discount_value / 100))
      : Math.round(promo.discount_value)
    : 0;
  const percentDiscount = percentOffer ? percentOfferDiscountPence(baseAmount) : 0;
  // One discount per booking: whichever is bigger.
  const usePercentOffer = percentDiscount > 0 && percentDiscount >= promoDiscount;
  if (usePercentOffer) promo = null;
  const discount = usePercentOffer ? percentDiscount : promoDiscount;
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
    billed_hours: String(breakdown.billableHours),
    cleaning_standard: parsed.data.cleaningStandard,
    discount_pence: String(Math.max(0, baseAmount - amount)),
    offer_callback_lead_id: usePercentOffer ? percentOffer!.leadId : (offer?.leadId ?? ""),
    offer_free_hours: String(offer?.freeHours ?? 0),
    offer_kind: usePercentOffer ? PERCENT_OFFER_KIND : offer ? "free_hour" : "",
    promo_code_id: promo?.id ?? "",
    scheduled_date: parsed.data.scheduledDate,
    scheduled_time: parsed.data.scheduledTime,
    selected_add_ons: parsed.data.selectedAddOns.join(","),
    service_type: parsed.data.serviceType,
    work_hours: String(breakdown.visitHours),
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
