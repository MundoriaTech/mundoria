import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/auth";
import { refundBookingPayment } from "@/lib/payments/service";

const schema = z.object({
  amount: z.number().int().positive().optional(),
  booking_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid refund" }, { status: 400 });
  try {
    const paymentIntentId = await refundBookingPayment(
      parsed.data.booking_id,
      parsed.data.amount,
    );
    return NextResponse.json({ payment_intent_id: paymentIntentId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refund failed" },
      { status: 400 },
    );
  }
}
