import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { alertAdmins } from "@/lib/notifications/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

function webhookSecrets() {
  return [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ].filter((value): value is string => Boolean(value?.trim()));
}

function constructStripeEvent(payload: string, signature: string) {
  const stripe = getStripe();
  const secrets = webhookSecrets();
  if (secrets.length === 0) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Invalid webhook signature");
}

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  const secrets = webhookSecrets();
  if (!signature || secrets.length === 0) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = constructStripeEvent(await request.text(), signature);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature" },
      { status: 400 },
    );
  }
  const admin = createAdminClient();
  // Note: `transfer.failed` was removed by Stripe (API ≥ 2017-04-06). Connect
  // transfers succeed or throw synchronously in our payout routes; async bank
  // failures arrive as `payout.failed` on connected accounts.
  switch (event.type) {
    case "payment_intent.amount_capturable_updated": {
      const intent = event.data.object;
      const { data: booking } = await admin
        .from("bookings")
        .update({ payment_status: "held" })
        .eq("stripe_payment_intent_id", intent.id)
        .in("payment_status", ["unpaid", "held"])
        .select("id,status")
        .maybeSingle();
      if (booking?.status === "pending_match") {
        const { runMatchingEngine } = await import("@/lib/matching/engine");
        await runMatchingEngine(booking.id).catch(() => undefined);
      }
      break;
    }
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
