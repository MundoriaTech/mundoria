import Link from "next/link";
import { redirect } from "next/navigation";

import { EarningsControls } from "@/components/cleaner/earnings-controls";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Payout } from "@/types/cleaner";
import { cn } from "@/lib/utils";

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
        {done.length ? (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {done.map((job) => (
                <article
                  className="rounded-xl border border-border bg-background p-4"
                  key={job.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatServiceName(job.service_type)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {job.scheduled_date}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">
                      {formatMoney(job.amount_cleaner)}
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <dt>Gross</dt>
                      <dd className="text-sm text-foreground">
                        {formatMoney(job.amount_total)}
                      </dd>
                    </div>
                    <div>
                      <dt>Commission</dt>
                      <dd className="text-sm text-foreground">
                        {formatMoney(
                          (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
                        )}
                      </dd>
                    </div>
                  </dl>
                  <ButtonLink href={`/cleaner/job/${job.id}`} />
                </article>
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-background md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Date</th>
                    <th>Service</th>
                    <th>Gross</th>
                    <th>Commission</th>
                    <th>Net</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {done.map((job) => (
                    <tr className="border-b last:border-0" key={job.id}>
                      <td className="p-3">{job.scheduled_date}</td>
                      <td>{formatServiceName(job.service_type)}</td>
                      <td>{formatMoney(job.amount_total)}</td>
                      <td>
                        {formatMoney(
                          (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
                        )}
                      </td>
                      <td className="font-semibold">
                        {formatMoney(job.amount_cleaner)}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                          href={`/cleaner/job/${job.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Completed jobs will show here with your net earnings.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payout history</h2>
        {payoutRows.length ? (
          <div className="mt-3 space-y-2">
            {payoutRows.map((payout) => (
              <div
                className="flex flex-col gap-2 rounded-xl border bg-background p-4 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"
                key={payout.id}
              >
                <div>
                  <p className="font-medium">
                    {payout.period_start} → {payout.period_end}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <StatusBadge status={payout.status} />
                  </p>
                </div>
                <p className="text-lg font-semibold">
                  {formatMoney(payout.net_amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Payouts appear after completed cleans are captured and transferred.
          </p>
        )}
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

function ButtonLink({ href }: { href: string }) {
  return (
    <Link
      className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-2 hover:underline"
      href={href}
    >
      View job
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        status === "paid" || status === "transferred"
          ? "bg-emerald-100 text-emerald-900"
          : status === "failed"
            ? "bg-red-100 text-red-900"
            : "bg-amber-100 text-amber-950",
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
