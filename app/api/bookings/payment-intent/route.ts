import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { bookingDraftSchema } from "@/lib/customer/booking-schema";
import { estimatePrice } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Address } from "@/types/customer";

interface PromoRecord {
  discount_type: "fixed" | "percentage";
  discount_value: number;
  id: string;
}

export async function POST(request: Request) {
  const parsed = bookingDraftSchema.safeParse(await request.json());

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

  const [{ data: address }, { data: profile }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("id", parsed.data.addressId)
      .eq("customer_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email, phone, stripe_customer_id")
      .eq("id", user.id)
      .single(),
  ]);

  if (!address || !profile) {
    return NextResponse.json(
      { error: "Address or customer profile not found" },
      { status: 404 },
    );
  }

  const admin = createAdminClient();
  let promo: PromoRecord | null = null;

  if (parsed.data.promoCode) {
    const now = new Date().toISOString();
    const { data } = await admin
      .from("promo_codes")
      .select("id, discount_type, discount_value, max_uses, uses_count")
      .eq("code", parsed.data.promoCode.toUpperCase())
      .eq("is_active", true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .maybeSingle();

    if (!data || (data.max_uses !== null && data.uses_count >= data.max_uses)) {
      return NextResponse.json(
        { error: "That promo code is invalid or has expired." },
        { status: 400 },
      );
    }

    promo = data as PromoRecord;
  }

  const baseAmount = estimatePrice(
    parsed.data.serviceType,
    address as Address,
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

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    capture_method: "manual",
    currency: "gbp",
    customer: stripeCustomerId,
    metadata: {
      address_id: parsed.data.addressId,
      promo_code_id: promo?.id ?? "",
      service_type: parsed.data.serviceType,
      supabase_user_id: user.id,
    },
    setup_future_usage: "off_session",
  });

  return NextResponse.json({
    amount,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    promoCodeId: promo?.id ?? null,
  });
}
