import { TierBadge } from "@/components/cleaner/tier-badge";
import { getCleanerContext } from "@/lib/cleaner/server";
import { nextTier, TIER_REQUIREMENTS } from "@/lib/cleaner/tier";
import { createServerClient } from "@/lib/supabase/server";
import type { PerformanceHistory } from "@/types/cleaner";

export default async function CleanerPerformancePage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [context, { data: history }] = await Promise.all([
    getCleanerContext(supabase, user!.id),
    supabase
      .from("performance_history")
      .select("*")
      .eq("cleaner_id", user!.id)
      .order("month"),
  ]);
  const cleaner = context.cleanerProfile;
  const next = nextTier(cleaner.tier);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = cleaner.total_jobs > 0;
  const cancellationReliability = Math.max(0, 100 - cleaner.cancellation_count * 10);

  return (
    <div className="space-y-7">
      <h1 className="text-3xl font-semibold">Performance</h1>

      <section className="rounded-2xl bg-emerald-950 p-6 text-white">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-emerald-200">Current tier</p>
            <TierBadge className="mt-2" tier={cleaner.tier} />
          </div>
          <div className="text-right">
            <p className="text-emerald-200">Total score</p>
            {hasCompletedJobs ? (
              <>
                <b className="text-4xl">{cleaner.performance_score}</b>
                <span>/100</span>
              </>
            ) : (
              <b className="text-2xl">No data yet</b>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Metric
          label="Customer rating · 50%"
          value={hasCompletedJobs ? cleaner.rating * 20 : null}
        />
        <Metric
          label="On-time arrival · 20%"
          value={hasCompletedJobs ? cleaner.on_time_rate : null}
        />
        <Metric
          label="Acceptance · 15%"
          value={
            hasCompletedJobs || Number(cleaner.acceptance_rate) !== 100
              ? cleaner.acceptance_rate
              : null
          }
        />
        <Metric
          label="Cancellation reliability · 15%"
          value={hasCompletedJobs ? cancellationReliability : null}
        />
      </div>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Progress to {next}</h2>
        <Progress
          label={
            hasCompletedJobs
              ? `Rating ${cleaner.rating}/${requirement.rating}`
              : "Rating starts after customer reviews"
          }
          value={
            hasCompletedJobs && requirement.rating
              ? (cleaner.rating / requirement.rating) * 100
              : 0
          }
        />
        <Progress
          label={`Jobs ${cleaner.total_jobs}/${requirement.jobs}`}
          value={requirement.jobs ? (cleaner.total_jobs / requirement.jobs) * 100 : 0}
        />
        <Progress
          label={
            hasCompletedJobs
              ? `Score ${cleaner.performance_score}/${requirement.score}`
              : "Score starts after completed jobs"
          }
          value={
            hasCompletedJobs && requirement.score
              ? (cleaner.performance_score / requirement.score) * 100
              : 0
          }
        />
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Monthly performance</h2>
        <div className="mt-5 flex h-48 items-end gap-3">
          {((history ?? []) as PerformanceHistory[]).map((item) => (
            <div className="flex flex-1 flex-col items-center" key={item.id}>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${Math.max(4, item.total_score)}%` }}
              />
              <span className="mt-2 text-[10px]">{item.month.slice(0, 7)}</span>
            </div>
          ))}
        </div>
        {!history?.length ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Monthly history appears after your first review cycle.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Reliability history</h2>
        <p className="mt-3 text-sm">
          Cancellations: <b>{cleaner.cancellation_count}</b> · No-shows:{" "}
          <b>{cleaner.no_show_count}</b>
        </p>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const width = value === null ? 0 : Math.min(100, value);

  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">
        {value === null ? "Not enough data" : `${Number(value).toFixed(1)}%`}
      </p>
      <div className="mt-3 h-2 rounded bg-muted">
        <div className="h-2 rounded bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Progress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const percent = Math.min(100, Math.round(value));

  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded bg-muted">
        <div
          className="h-2 rounded bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
