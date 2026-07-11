import { NextResponse } from "next/server";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: payouts } = await auth.admin
    .from("payouts")
    .select("*,profile:profiles!payouts_cleaner_id_fkey(stripe_account_id)")
    .eq("status", "pending");
  const stripe = getStripe();
  const results: { id: string; status: string; error?: string }[] = [];
  for (const payout of payouts ?? []) {
    try {
      if (!payout.profile?.stripe_account_id || payout.net_amount <= 0) {
        throw new Error("Cleaner Stripe account or payout amount is missing.");
      }
      await auth.admin.from("payouts").update({ status: "processing" }).eq("id", payout.id);
      const transfer = await stripe.transfers.create({
        amount: payout.net_amount,
        currency: "gbp",
        destination: payout.profile.stripe_account_id,
        metadata: { payout_id: payout.id },
      });
      await auth.admin
        .from("payouts")
        .update({
          processed_at: new Date().toISOString(),
          status: "paid",
          stripe_transfer_id: transfer.id,
        })
        .eq("id", payout.id);
      results.push({ id: payout.id, status: "paid" });
    } catch (error) {
      await auth.admin.from("payouts").update({ status: "failed" }).eq("id", payout.id);
      results.push({
        error: error instanceof Error ? error.message : "Transfer failed",
        id: payout.id,
        status: "failed",
      });
    }
  }
  await logAdminAction({
    action: "process_payout_batch",
    adminId: auth.user.id,
    entityType: "payout",
    metadata: { results },
    reason: `Processed ${results.length} payouts`,
  });
  return NextResponse.json({ results });
}
