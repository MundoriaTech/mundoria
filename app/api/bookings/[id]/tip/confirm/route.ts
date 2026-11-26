import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { addPayoutAmount, chargeIdOf } from "@/lib/payments/service";
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
  const { user } = await getRequestUser(request);
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
  // Record the tip once: a repeated confirm must not pay the cleaner twice.
  const { data: tipped, error } = await admin
    .from("bookings")
    .update({ tip_pence: intent.amount })
    .eq("id", params.id)
    .eq("customer_id", user.id)
    .or("tip_pence.is.null,tip_pence.eq.0")
    .select("cleaner_id")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // The whole tip goes to the cleaner who did the visit, in their next payout.
  if (tipped?.cleaner_id) {
    await addPayoutAmount({
      bookingId: params.id,
      chargeId: chargeIdOf(intent),
      cleanerId: tipped.cleaner_id as string,
      grossPence: intent.amount,
      kind: "tip",
      netPence: intent.amount,
    });
  }
  return NextResponse.json({ success: true, tipPence: intent.amount });
}
