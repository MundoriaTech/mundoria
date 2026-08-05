import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { estimatePrice } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const now = new Date().toISOString();
  const { data: promo } = await createAdminClient()
    .from("promo_codes")
    .select("discount_type, discount_value, max_uses, uses_count")
    .eq("code", parsed.data.code.toUpperCase())
    .eq("is_active", true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .maybeSingle();

  if (!promo || (promo.max_uses !== null && promo.uses_count >= promo.max_uses)) {
    return NextResponse.json(
      { error: "That promo code is invalid or has expired." },
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
    message: "Promo code applied.",
  });
}
