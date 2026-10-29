import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { resolvePromoForCheckout } from "@/lib/customer/referrals";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { estimatePrice } from "@/lib/customer/services";
import type { Address } from "@/types/customer";

const schema = bookingDraftSchema
  .pick({
    addressId: true,
    cleaningStandard: true,
    numBathrooms: true,
    numBedrooms: true,
    officeSpaces: true,
    otherRoomTypes: true,
    scheduledDate: true,
    scheduledTime: true,
    selectedAddOns: true,
    serviceType: true,
  })
  .extend({
    code: z.string().trim().min(1).max(40),
    /** Optional — formula hours used when the customer has not chosen a length yet. */
    estimatedDurationHours: z.number().min(1).max(12).nullable().optional(),
  });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid promo code." }, { status: 400 });
  }

  const { supabase, user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", parsed.data.addressId)
    .eq("customer_id", user.id)
    .single();
  if (!address) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  let promo: {
    discount_type: "fixed" | "percentage";
    discount_value: number;
    id: string;
  };
  try {
    const resolved = await resolvePromoForCheckout({
      code: parsed.data.code,
      customerId: user.id,
    });
    if (!resolved) {
      return NextResponse.json(
        { error: "That promo code is invalid or has expired." },
        { status: 400 },
      );
    }
    promo = resolved;
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

  const pricing = await loadServicePricing();
  const baseAmount = estimatePrice(
    parsed.data.serviceType,
    address as Address,
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
  const discount =
    promo.discount_type === "percentage"
      ? Math.round(baseAmount * (promo.discount_value / 100))
      : Math.round(promo.discount_value);

  return NextResponse.json({
    amount: Math.max(100, baseAmount - discount),
    discount,
    message: "Promo or referral code applied.",
  });
}
