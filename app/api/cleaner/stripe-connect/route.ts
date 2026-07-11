import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, stripe_account_id")
    .eq("id", user.id)
    .single();

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

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/cleaner/profile?stripe=refresh`,
    return_url: `${origin}/cleaner/profile?stripe=complete`,
    type: "account_onboarding",
  });
  return NextResponse.json({ url: link.url });
}
