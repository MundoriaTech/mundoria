import { CalendarCheck, Star, Trophy, type LucideIcon } from "lucide-react";

import { TierBadge } from "@/components/cleaner/tier-badge";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { nextTier, TIER_REQUIREMENTS } from "@/lib/cleaner/tier";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";

export default async function CleanerDashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [context, jobs] = await Promise.all([
    getCleanerContext(supabase, user!.id),
    getCleanerJobs(user!.id),
  ]);
  const cleaner = context.cleanerProfile;
  const today = new Date().toISOString().slice(0, 10);
  const todayJobs = jobs.filter(
    (job) =>
      job.scheduled_date === today &&
      !["cancelled", "completed"].includes(job.status),
  );
  const completed = jobs.filter((job) => job.status === "completed");
  const week = completed
    .filter(
      (job) => Date.now() - new Date(job.scheduled_date).getTime() < 7 * 864e5,
    )
    .reduce((sum, job) => sum + (job.amount_cleaner ?? 0), 0);
  const month = completed
    .filter(
      (job) => new Date(job.scheduled_date).getMonth() === new Date().getMonth(),
    )
    .reduce((sum, job) => sum + (job.amount_cleaner ?? 0), 0);
  const next = nextTier(cleaner.tier);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = cleaner.total_jobs > 0;
  const tierProgress = requirement.score
    ? Math.min(100, (cleaner.performance_score / requirement.score) * 100)
    : 0;

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-primary">Cleaner dashboard</p>
        <h1 className="text-3xl font-semibold">Ready for a brilliant day?</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="This week" value={formatMoney(week)} />
        <Stat label="This month" value={formatMoney(month)} />
      </div>

      <section className="rounded-xl border bg-background p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current tier</p>
            <TierBadge className="mt-2" tier={cleaner.tier} />
          </div>
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <div className="mt-4 h-2 rounded bg-muted">
          <div
            className="h-2 rounded bg-primary"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {hasCompletedJobs
            ? `${cleaner.performance_score}/100 toward ${next}`
            : `Progress toward ${next} starts after completed jobs and ratings.`}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Performance"
          value={hasCompletedJobs ? `${cleaner.performance_score}/100` : "No data yet"}
        />
        <Stat
          icon={Star}
          label="Rating"
          value={hasCompletedJobs ? `${cleaner.rating}/5` : "No ratings yet"}
        />
        <Stat
          label="On time"
          value={hasCompletedJobs ? `${cleaner.on_time_rate}%` : "No jobs yet"}
        />
        <Stat
          label="Acceptance"
          value={
            hasCompletedJobs || Number(cleaner.acceptance_rate) !== 100
              ? `${cleaner.acceptance_rate}%`
              : "No offers yet"
          }
        />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Today&apos;s jobs</h2>
        <div className="space-y-3">
          {todayJobs.map((job) => (
            <a
              className="flex justify-between rounded-xl border bg-background p-4"
              href={`/cleaner/job/${job.id}`}
              key={job.id}
            >
              <span>
                <b>{formatServiceName(job.service_type)}</b>
                <small className="mt-1 block text-muted-foreground">
                  {job.scheduled_start_time.slice(0, 5)} · {job.address?.city}
                </small>
              </span>
              <CalendarCheck className="text-primary" />
            </a>
          ))}
          {!todayJobs.length ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No jobs today.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-5">
      {Icon ? <Icon className="mb-3 h-5 w-5 text-primary" /> : null}
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
