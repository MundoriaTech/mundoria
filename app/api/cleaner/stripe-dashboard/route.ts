import * as Sentry from "@sentry/nextjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json(
      { error: "Connect Stripe first." },
      { status: 400 },
    );
  }

  try {
    const link = await getStripe().accounts.createLoginLink(
      profile.stripe_account_id,
    );

    return NextResponse.json({ url: link.url });
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open Stripe Express.",
      },
      { status: 400 },
    );
  }
}
