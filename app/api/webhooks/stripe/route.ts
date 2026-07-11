import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { alertAdmins } from "@/lib/notifications/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature" },
      { status: 400 },
    );
  }
  const admin = createAdminClient();
  if ((event.type as string) === "transfer.failed") {
    const transfer = event.data.object as Stripe.Transfer;
    await admin
      .from("payouts")
      .update({ status: "failed" })
      .eq("stripe_transfer_id", transfer.id);
    await alertAdmins(
      "payout_failed",
      "Cleaner transfer failed",
      `Stripe transfer ${transfer.id} failed.`,
      { stripe_transfer_id: transfer.id },
    );
    return NextResponse.json({ received: true });
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      await admin
        .from("bookings")
        .update({ payment_status: "released" })
        .eq("stripe_payment_intent_id", intent.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await admin
        .from("bookings")
        .update({ payment_status: "unpaid" })
        .eq("stripe_payment_intent_id", intent.id);
      await alertAdmins(
        "payment_failed",
        "Customer payment failed",
        `PaymentIntent ${intent.id} failed.`,
        { payment_intent_id: intent.id },
      );
      break;
    }
    case "payout.failed": {
      const payout = event.data.object;
      const payoutId = payout.metadata?.payout_id;
      if (payoutId) {
        await admin
          .from("payouts")
          .update({ status: "failed" })
          .eq("id", payoutId);
      }
      await alertAdmins(
        "payout_failed",
        "Cleaner payout failed",
        `Stripe payout ${payout.id} failed.`,
        { stripe_payout_id: payout.id },
      );
      break;
    }
    case "account.updated": {
      const account = event.data.object;
      await admin
        .from("cleaner_profiles")
        .update({
          stripe_onboarding_complete:
            account.details_submitted && account.payouts_enabled,
        })
        .eq(
          "id",
          (
            await admin
              .from("profiles")
              .select("id")
              .eq("stripe_account_id", account.id)
              .maybeSingle()
          ).data?.id ?? "",
        );
      break;
    }
  }
  return NextResponse.json({ received: true });
}
