import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { resolvePromoForCheckout } from "@/lib/customer/referrals";
import { estimatePrice } from "@/lib/customer/services";
import type { Address } from "@/types/customer";

const schema = bookingDraftSchema
  .pick({
    addressId: true,
    cleaningStandard: true,
    selectedAddOns: true,
    serviceType: true,
  })
  .extend({
    code: z.string().trim().min(1).max(40),
  });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid promo code." }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const baseAmount = estimatePrice(
    parsed.data.serviceType,
    address as Address,
    parsed.data.cleaningStandard,
    parsed.data.selectedAddOns,
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
