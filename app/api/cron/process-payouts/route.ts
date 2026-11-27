import { sendBrandedEmail } from "@/lib/email/send-email";
import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { alertAdmins } from "@/lib/notifications/admin";
import { sendPushNotification } from "@/lib/notifications/send";
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
    .select("id,cleaner_id,net_amount")
    .eq("status", "pending")
    .lte("period_end", today);
  const results = [];
  for (const payout of payouts ?? []) {
    // Not connected to Stripe yet: keep the payout waiting (never "failed",
    // which is never retried) and remind the cleaner, at most once a day.
    if (!(await payoutsReady(admin, payout.cleaner_id as string))) {
      await remindToConnect(admin, payout.cleaner_id as string, Number(payout.net_amount ?? 0));
      results.push({ id: payout.id, status: "waiting_for_stripe" });
      continue;
    }
    try {
      const transfer = await processCleanerPayout(payout.id);
      results.push({ id: payout.id, status: "paid", transfer: transfer.id });
    } catch (error) {
      await admin.from("payouts").update({ status: "failed" }).eq("id", payout.id);
      // Tell the cleaner too, so they can check their payout details.
      const { data: failed } = await admin
        .from("payouts")
        .select("net_amount,period_start,period_end,profile:profiles!payouts_cleaner_id_fkey(email,full_name)")
        .eq("id", payout.id)
        .single();
      const profile = (Array.isArray(failed?.profile) ? failed?.profile[0] : failed?.profile) as
        | { email?: string | null; full_name?: string | null }
        | null
        | undefined;
      if (profile?.email) {
        await sendBrandedEmail({
          data: {
            amount: `£${(Number(failed?.net_amount ?? 0) / 100).toFixed(2)}`,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
            firstName: profile.full_name?.split(" ")[0],
            period: `${failed?.period_start} to ${failed?.period_end}`,
          },
          template: "cleaner.payout_failed",
          to: profile.email,
        }).catch(() => undefined);
      }
      await alertAdmins(
        "payout_failed",
        "A scheduled cleaner payout failed",
        "A payout we tried to send automatically did not go through. Please check Payouts and the cleaner’s bank details.",
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

type Admin = ReturnType<typeof createAdminClient>;

/** A payout can only go out once the cleaner's Stripe account takes payouts. */
async function payoutsReady(admin: Admin, cleanerId: string) {
  const [{ data: profile }, { data: cleaner }] = await Promise.all([
    admin.from("profiles").select("stripe_account_id").eq("id", cleanerId).maybeSingle(),
    admin.from("cleaner_profiles").select("stripe_onboarding_complete").eq("id", cleanerId).maybeSingle(),
  ]);
  return Boolean(profile?.stripe_account_id && cleaner?.stripe_onboarding_complete);
}

async function remindToConnect(admin: Admin, cleanerId: string, netPence: number) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", cleanerId)
    .eq("title", "Connect Stripe to get paid")
    .gte("created_at", since)
    .limit(1);
  if (recent?.length) return;
  await sendPushNotification(
    cleanerId,
    "Connect Stripe to get paid",
    `£${(netPence / 100).toFixed(2)} is waiting for you. Open your dashboard and finish payout setup with Stripe, and it's paid on the next payout run.`,
    { href: "/cleaner/dashboard" },
  ).catch(() => undefined);
}
