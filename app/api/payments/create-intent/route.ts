import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureBookingPaymentIntent } from "@/lib/payments/follow-on";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  amount: z.number().int().min(100).optional(),
  booking_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid booking required" },
      { status: 400 },
    );
  }
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  try {
    const intent = await ensureBookingPaymentIntent({
      bookingId: parsed.data.booking_id,
      customerId: user.id,
      stripeCustomerId: profile?.stripe_customer_id,
    });
    return NextResponse.json(intent);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 400 },
    );
  }
}
