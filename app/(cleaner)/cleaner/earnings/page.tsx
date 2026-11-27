import { redirect } from "next/navigation";

import { ConnectPayoutCard } from "@/components/cleaner/connect-payout-card";
import { EarningsControls } from "@/components/cleaner/earnings-controls";
import {
  CompletedJobsHistory,
  PayoutHistoryList,
} from "@/components/cleaner/earnings-history";
import { SectionHeading } from "@/components/customer/dashboard/section-banner";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { formatMoney } from "@/lib/customer/services";
import { refreshCleanerStripeStatus } from "@/lib/stripe/cleaner-connect";
import { createServerClient } from "@/lib/supabase/server";
import type { Payout } from "@/types/cleaner";

export const metadata = { title: "Earnings" };

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

export default async function CleanerEarningsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [ctx, jobs, { data: payouts }] = await Promise.all([
    getCleanerContext(supabase, user.id),
    getCleanerJobs(user.id),
    supabase
      .from("payouts")
      .select("*")
      .eq("cleaner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!ctx.cleanerProfile || !ctx.profile) redirect("/");

  const cleaner = ctx.cleanerProfile;
  const profile = ctx.profile;
  if (
    profile.stripe_account_id &&
    !cleaner.stripe_onboarding_complete &&
    (cleaner.status === "certified" || cleaner.status === "active")
  ) {
    cleaner.stripe_onboarding_complete = await refreshCleanerStripeStatus({
      accountId: profile.stripe_account_id,
      cleanerId: user.id,
      current: false,
    });
  }

  const done = jobs.filter((job) => job.status === "completed");
  const sum = (days: number) =>
    done
      .filter(
        (job) =>
          Date.now() - new Date(job.scheduled_date).getTime() < days * 864e5,
      )
      .reduce((total, job) => total + (job.amount_cleaner ?? 0), 0);
  const all = done.reduce((total, job) => total + (job.amount_cleaner ?? 0), 0);
  const payoutRows = (payouts ?? []) as Payout[];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {!cleaner.stripe_onboarding_complete ? (
        <ConnectPayoutCard
          hasStripeAccount={Boolean(profile.stripe_account_id)}
          stripeComplete={cleaner.stripe_onboarding_complete}
        />
      ) : null}

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="This week" value={formatMoney(sum(7))} />
          <SummaryTile label="This month" value={formatMoney(sum(31))} />
          <SummaryTile label="All time" value={formatMoney(all)} />
        </div>
        <p className="m-0 text-[13px] leading-5 text-[#6B6B70]">
          Card holds are authorised at booking and captured after the clean.
          Your share then lands in the next payout window.
        </p>
      </section>

      <EarningsControls preference={cleaner.payout_preference} />

      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Completed jobs" />
        <CompletedJobsHistory jobs={done} />
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Payout history" />
        <PayoutHistoryList payouts={payoutRows} />
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
      <p className={tileLabel}>{label}</p>
      <p className="m-0 mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#523F97]">
        {value}
      </p>
    </div>
  );
}
