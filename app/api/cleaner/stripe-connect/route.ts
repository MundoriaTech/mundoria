import { getRequestUser } from "@/lib/supabase/request-client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: profile }, { data: cleaner }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, stripe_account_id")
      .eq("id", user.id)
      .single(),
    admin
      .from("cleaner_profiles")
      .select("onboarding_complete, status, stripe_onboarding_complete")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (
    !cleaner?.onboarding_complete ||
    (cleaner.status !== "certified" && cleaner.status !== "active")
  ) {
    return NextResponse.json(
      {
        error:
          "Connect Stripe after Mundoria approves your application. You’ll see payout setup on your dashboard.",
      },
      { status: 403 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local and restart the dev server.",
      },
      { status: 400 },
    );
  }

  let accountId = profile?.stripe_account_id as string | null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: "GB",
        email: profile?.email,
        metadata: { supabase_user_id: user.id },
        type: "express",
      });
      accountId = account.id;
      await admin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    }

    const session = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_management: { enabled: true },
        account_onboarding: { enabled: true },
        notification_banner: { enabled: true },
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      stripeComplete: Boolean(cleaner.stripe_onboarding_complete),
    });
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start payout setup.",
      },
      { status: 400 },
    );
  }
}
