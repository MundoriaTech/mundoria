import { redirect } from "next/navigation";

import { EarningsControls } from "@/components/cleaner/earnings-controls";
import {
  CompletedJobsHistory,
  PayoutHistoryList,
} from "@/components/cleaner/earnings-history";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { formatMoney } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Payout } from "@/types/cleaner";

export const metadata = { title: "Earnings" };

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
  if (!ctx.cleanerProfile) redirect("/");
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Earnings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Card holds are authorised at booking and captured after the clean.
          Your share then lands in the next payout window.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="This week" value={formatMoney(sum(7))} />
        <Card label="This month" value={formatMoney(sum(31))} />
        <Card label="All time" value={formatMoney(all)} />
      </div>

      <EarningsControls preference={ctx.cleanerProfile.payout_preference} />

      <section>
        <h2 className="text-lg font-semibold">Completed jobs</h2>
        <CompletedJobsHistory jobs={done} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payout history</h2>
        <PayoutHistoryList payouts={payoutRows} />
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
