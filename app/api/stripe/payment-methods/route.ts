import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe/server";

export type SavedCardSummary = {
  brand: string;
  expMonth: number;
  expYear: number;
  id: string;
  isDefault: boolean;
  last4: string;
};

export async function GET(request: Request) {
  const { supabase, user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "customer") {
    return NextResponse.json({ paymentMethods: [] as SavedCardSummary[] });
  }

  const stripeCustomerId = profile.stripe_customer_id as string | null;
  if (!stripeCustomerId) {
    return NextResponse.json({ paymentMethods: [] as SavedCardSummary[] });
  }

  try {
    const stripe = getStripe();
    const [methods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
        limit: 10,
      }),
      stripe.customers.retrieve(stripeCustomerId),
    ]);

    const defaultId =
      !("deleted" in customer && customer.deleted) &&
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : !("deleted" in customer && customer.deleted) &&
            customer.invoice_settings?.default_payment_method &&
            typeof customer.invoice_settings.default_payment_method === "object"
          ? customer.invoice_settings.default_payment_method.id
          : null;

    const paymentMethods: SavedCardSummary[] = methods.data
      .filter((method) => method.card)
      .map((method) => ({
        brand: method.card!.brand,
        expMonth: method.card!.exp_month,
        expYear: method.card!.exp_year,
        id: method.id,
        isDefault: method.id === defaultId,
        last4: method.card!.last4,
      }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    const message =
      error instanceof Stripe.errors.StripeError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unable to load saved cards.";
    console.error("[payment-methods]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
