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
      .select("onboarding_complete, status")
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

  if (!accountId) {
    const account = await stripe.accounts.create({
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
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

  let returnTo = "/cleaner/profile";
  try {
    const body = (await request.json()) as { returnTo?: string };
    if (
      body.returnTo === "/cleaner/dashboard" ||
      body.returnTo === "/cleaner/earnings" ||
      body.returnTo === "/cleaner/profile"
    ) {
      returnTo = body.returnTo;
    }
  } catch {
    // Optional body — default return path is profile.
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}${returnTo}?stripe=refresh`,
    return_url: `${origin}${returnTo}?stripe=complete`,
    type: "account_onboarding",
  });
  return NextResponse.json({ url: link.url });
}
