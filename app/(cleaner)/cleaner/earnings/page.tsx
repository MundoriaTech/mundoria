import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import { EarningsControls } from "@/components/cleaner/earnings-controls";
import type { Payout } from "@/types/cleaner";

export default async function CleanerEarningsPage() {
  const s = createServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  const [ctx, jobs, { data: payouts }] = await Promise.all([
    getCleanerContext(s, user!.id),
    getCleanerJobs(user!.id),
    s
      .from("payouts")
      .select("*")
      .eq("cleaner_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);
  const done = jobs.filter((j) => j.status === "completed");
  const sum = (days: number) =>
    done
      .filter(
        (j) => Date.now() - new Date(j.scheduled_date).getTime() < days * 864e5,
      )
      .reduce((n, j) => n + (j.amount_cleaner ?? 0), 0);
  const all = done.reduce((n, j) => n + (j.amount_cleaner ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Earnings</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Card l="This week" v={formatMoney(sum(7))} />
        <Card l="This month" v={formatMoney(sum(31))} />
        <Card l="All time" v={formatMoney(all)} />
      </div>
      <EarningsControls preference={ctx.cleanerProfile.payout_preference} />

      <div className="mt-7 space-y-3 md:hidden">
        {done.map((j) => (
          <article
            className="rounded-xl border border-border bg-background p-4"
            key={j.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{formatServiceName(j.service_type)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {j.scheduled_date}
                </p>
              </div>
              <p className="shrink-0 font-semibold">
                {formatMoney(j.amount_cleaner)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <dt>Gross</dt>
                <dd className="text-sm text-foreground">
                  {formatMoney(j.amount_total)}
                </dd>
              </div>
              <div>
                <dt>Commission</dt>
                <dd className="text-sm text-foreground">
                  {formatMoney((j.amount_total ?? 0) - (j.amount_cleaner ?? 0))}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-7 hidden overflow-x-auto rounded-xl border bg-background md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">Date</th>
              <th>Service</th>
              <th>Gross</th>
              <th>Commission</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {done.map((j) => (
              <tr className="border-b last:border-0" key={j.id}>
                <td className="p-3">{j.scheduled_date}</td>
                <td>{formatServiceName(j.service_type)}</td>
                <td>{formatMoney(j.amount_total)}</td>
                <td>
                  {formatMoney((j.amount_total ?? 0) - (j.amount_cleaner ?? 0))}
                </td>
                <td className="font-semibold">
                  {formatMoney(j.amount_cleaner)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Payout history</h2>
      <div className="mt-3 space-y-2">
        {((payouts ?? []) as Payout[]).map((p) => (
          <div
            className="flex flex-col gap-1 rounded-lg border bg-background p-4 min-[380px]:flex-row min-[380px]:justify-between"
            key={p.id}
          >
            <span>
              {p.period_start} ·{" "}
              <span className="capitalize">{p.status}</span>
            </span>
            <b>{formatMoney(p.net_amount)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="text-sm text-muted-foreground">{l}</p>
      <p className="mt-1 text-2xl font-bold">{v}</p>
    </div>
  );
}
