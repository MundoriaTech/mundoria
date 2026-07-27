import {
  CalendarCheck,
  Clock3,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { TierBadge } from "@/components/cleaner/tier-badge";
import { Button } from "@/components/ui/button";
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
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#221f50] p-7 text-white shadow-2xl shadow-[#221f50]/15 sm:p-9">
        <div className="absolute -right-20 top-0 -z-10 h-56 w-56 rounded-full bg-[#7669d1]/45 blur-3xl" />
        <div className="absolute -bottom-20 left-10 -z-10 h-44 w-44 rounded-full bg-[#ffc79f]/30 blur-3xl" />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/80">
          <Sparkles className="h-4 w-4 text-[#ffc79f]" />
          Cleaner dashboard
        </p>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Ready for a brilliant day?
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">
              Track today’s jobs, monitor performance, and keep your CleanScape
              profile ready for better matches.
            </p>
          </div>
          <Button
            asChild
            className="bg-[#ffc79f] font-bold text-[#221f50] hover:bg-[#ffd4b8]"
          >
            <Link href="/cleaner/jobs">View jobs</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="This week" value={formatMoney(week)} />
        <Stat label="This month" value={formatMoney(month)} />
      </div>

      <section className="rounded-[1.75rem] border border-[#dedbfd] bg-white p-6 shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current tier</p>
            <TierBadge className="mt-2" tier={cleaner.tier} />
          </div>
          <Trophy className="h-8 w-8 text-[#ffc06f]" />
        </div>
        <div className="mt-4 h-2 rounded-full bg-[#e7e4ff]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#5a51aa] to-[#ffc79f]"
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
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#221f50]">
          Today&apos;s jobs
        </h2>
        <div className="space-y-3">
          {todayJobs.map((job) => (
            <a
              className="flex justify-between rounded-2xl border border-[#dedbfd] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#5a51aa]/10"
              href={`/cleaner/job/${job.id}`}
              key={job.id}
            >
              <span>
                <b>{formatServiceName(job.service_type)}</b>
                <small className="mt-1 block text-muted-foreground">
                  {job.scheduled_start_time.slice(0, 5)} · {job.address?.city}
                </small>
              </span>
              <CalendarCheck className="text-[#5a51aa]" />
            </a>
          ))}
          {!todayJobs.length ? (
            <div className="rounded-2xl border border-dashed border-[#c9c4f2] bg-white p-8 text-center text-sm text-muted-foreground">
              <Clock3 className="mx-auto mb-3 h-6 w-6 text-[#5a51aa]" />
              No jobs today.
            </div>
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
    <div className="rounded-[1.5rem] border border-[#dedbfd] bg-white p-5 shadow-sm">
      {Icon ? <Icon className="mb-3 h-5 w-5 text-primary" /> : null}
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#221f50]">
        {value}
      </p>
    </div>
  );
}
