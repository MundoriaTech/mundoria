import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordTipPayment } from "@/lib/payments/tips";
import { getStripe } from "@/lib/stripe/server";

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
  try {
    await recordTipPayment({ bookingId: params.id, customerId: user.id, intent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record the tip." },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true, tipPence: intent.amount });
}
