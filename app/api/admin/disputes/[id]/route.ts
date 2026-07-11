import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe/server";

const schema = z.object({
  action: z.enum(["refund", "deduct", "resolve", "close"]),
  amount: z.number().int().positive().optional(),
  notes: z.string().trim().min(3),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  const { data: dispute } = await auth.admin
    .from("disputes")
    .select("*,booking:bookings(*)")
    .eq("id", params.id)
    .single();
  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  const { action, amount, notes } = parsed.data;
  if (action === "refund" && dispute.booking?.stripe_payment_intent_id) {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(dispute.booking.stripe_payment_intent_id);
    if (intent.status === "succeeded") {
      await stripe.refunds.create({
        amount: amount ?? intent.amount_received,
        payment_intent: intent.id,
        reason: "requested_by_customer",
      });
    } else if (!["canceled", "requires_payment_method"].includes(intent.status)) {
      await stripe.paymentIntents.cancel(intent.id);
    }
    await auth.admin
      .from("bookings")
      .update({ payment_status: "refunded" })
      .eq("id", dispute.booking_id);
  }
  if (action === "deduct" && dispute.booking?.cleaner_id) {
    const deduction = amount ?? dispute.booking.amount_cleaner ?? 0;
    const { data: pending } = await auth.admin
      .from("payouts")
      .select("id,net_amount")
      .eq("cleaner_id", dispute.booking.cleaner_id)
      .in("status", ["pending", "processing"])
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (pending) {
      await auth.admin
        .from("payouts")
        .update({ net_amount: Math.max(0, pending.net_amount - deduction) })
        .eq("id", pending.id);
    }
  }
  const status = action === "close" ? "closed" : "resolved";
  await auth.admin
    .from("disputes")
    .update({
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
      resolved_by: auth.user.id,
      status,
    })
    .eq("id", params.id);
  await logAdminAction({
    action: `dispute_${action}`,
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "dispute",
    metadata: { amount },
    reason: notes,
  });
  return NextResponse.json({ success: true });
}
