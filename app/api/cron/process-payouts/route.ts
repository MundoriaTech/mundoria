import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { alertAdmins } from "@/lib/notifications/admin";
import { processCleanerPayout } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: payouts } = await admin
    .from("payouts")
    .select("id")
    .eq("status", "pending")
    .lte("period_end", today);
  const results = [];
  for (const payout of payouts ?? []) {
    try {
      const transfer = await processCleanerPayout(payout.id);
      results.push({ id: payout.id, status: "paid", transfer: transfer.id });
    } catch (error) {
      await admin.from("payouts").update({ status: "failed" }).eq("id", payout.id);
      await alertAdmins(
        "payout_failed",
        "Cleaner payout failed",
        `Scheduled payout ${payout.id.slice(0, 8)} could not be processed.`,
        {
          error: error instanceof Error ? error.message : "Transfer failed",
          payout_id: payout.id,
        },
      );
      results.push({
        error: error instanceof Error ? error.message : "Transfer failed",
        id: payout.id,
        status: "failed",
      });
    }
  }
  return NextResponse.json({ results });
}
