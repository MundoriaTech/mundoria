import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  paymentIntentId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment reference required." }, { status: 400 });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);
  if (
    intent.metadata.booking_id !== params.id ||
    intent.metadata.supabase_user_id !== user.id ||
    intent.metadata.kind !== "tip" ||
    intent.status !== "succeeded"
  ) {
    return NextResponse.json({ error: "Tip payment was not completed." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({ tip_pence: intent.amount })
    .eq("id", params.id)
    .eq("customer_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, tipPence: intent.amount });
}
