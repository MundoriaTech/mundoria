import { BriefcaseBusiness, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CleanerHeroStage } from "@/components/cleaner/hero-stage";
import { CleanerOfferHighlight } from "@/components/cleaner/offer-highlight";
import { TierBadge } from "@/components/cleaner/tier-badge";
import {
  DashboardEmptyCard,
  DashboardHistoryList,
  DashboardSection,
  SessionHighlightCard,
} from "@/components/shared/dashboard-panels";
import {
  getAvailableJobs,
  getCleanerContext,
  getCleanerJobs,
} from "@/lib/cleaner/server";
import {
  cleanerTierLabel,
  nextTier,
  TIER_REQUIREMENTS,
} from "@/lib/cleaner/tier";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { sessionPhotoForService } from "@/lib/customer/booking-visibility";
import { cleanerHero, type CleanerHeroMoment } from "@/lib/avatars/hero-poses";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Cleaner dashboard" };

export default async function CleanerDashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [context, jobs, available] = await Promise.all([
    getCleanerContext(supabase, user.id),
    getCleanerJobs(user.id),
    getAvailableJobs(user.id),
  ]);
  const cleaner = context.cleanerProfile;
  const profile = context.profile;
  if (!cleaner || !profile) redirect("/");
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "there";
  const today = new Date().toISOString().slice(0, 10);
  const activeJobs = jobs
    .filter((job) => !["cancelled", "completed"].includes(job.status))
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const todayJobs = activeJobs.filter((job) => job.scheduled_date === today);
  const nextJob = todayJobs[0] ?? activeJobs[0] ?? null;
  const topOffer = available[0] ?? null;
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
  const recent = completed.slice(0, 5);
  const streak = visitStreak(jobs);
  const next = nextTier(cleaner.tier);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = cleaner.total_jobs > 0;
  const tierProgress = requirement.score
    ? Math.min(100, (cleaner.performance_score / requirement.score) * 100)
    : 0;
  const hero = cleanerHero({
    avatarUrl: profile.avatar_url,
    gender: cleaner.gender,
    hasOffer: Boolean(topOffer),
    hasVisitToday: todayJobs.length > 0,
    seed: user.id,
    streak,
  });
  const nextLabel = topOffer
    ? "Offer"
    : nextJob
      ? `${nextJob.scheduled_start_time.slice(0, 5)} · ${nextJob.address?.city ?? "Job"}`
      : "None";

  return (
    <div className="space-y-8 pb-4">
      <section>
        <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-end gap-x-2 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 pb-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#c79c66] sm:text-[11px]">
              Mundoria Pro
            </p>
            <h1 className="mt-2 text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1c133b] sm:text-[2.35rem]">
              Welcome back,{" "}
              <span className="font-normal text-[#d4694a]">{firstName}</span>.
            </h1>
            <p className="mt-2 max-w-md text-[13px] font-light leading-5 text-[#5c5670] sm:text-[15px] sm:leading-7">
              {heroLine(hero.moment, streak)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#1c133b] px-3.5 text-xs font-semibold text-white transition hover:bg-[#312c79] sm:h-12 sm:px-6 sm:text-sm"
                href="/cleaner/jobs"
              >
                <BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                View jobs
              </Link>
              <Link
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea] sm:h-12 sm:px-6 sm:text-sm"
                href="/cleaner/earnings"
              >
                <CalendarCheck className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                Earnings
              </Link>
            </div>
          </div>
          <CleanerHeroStage moment={hero.moment} src={hero.src} />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:mt-8 sm:grid-cols-4 sm:gap-6">
          <HeroStat label="Today" value={String(todayJobs.length)} />
          <HeroStat label="This week" value={formatMoney(week)} />
          <HeroStat label="This month" value={formatMoney(month)} />
          <HeroStat label="Next job" value={nextLabel} />
        </dl>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <DashboardSection
        eyebrow="On the schedule"
        title={topOffer ? "An offer is waiting" : "Next session"}
      >
        {topOffer ? (
          <CleanerOfferHighlight job={topOffer} />
        ) : nextJob ? (
          <SessionHighlightCard
            actions={
              <>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
                  href={`/cleaner/job/${nextJob.id}`}
                >
                  Open job
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea]"
                  href={`/cleaner/messages/${nextJob.id}`}
                >
                  Message
                </Link>
              </>
            }
            meta={[
              {
                label: "Date",
                value: new Date(
                  `${nextJob.scheduled_date}T12:00:00`,
                ).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                }),
              },
              {
                label: "Time",
                value: nextJob.scheduled_start_time.slice(0, 5),
              },
              {
                label: "Area",
                value: nextJob.address?.city ?? "—",
              },
              {
                label: "Earn",
                value: nextJob.amount_cleaner
                  ? formatMoney(nextJob.amount_cleaner)
                  : "—",
              },
            ]}
            personLine={
              nextJob.scheduled_date === today
                ? "Today’s session"
                : "Upcoming session"
            }
            photoSrc={sessionPhotoForService(nextJob.service_type)}
            statusLabel={
              nextJob.status === "matched" ? "Offer pending" : "Confirmed"
            }
            statusTone={nextJob.status === "matched" ? "waiting" : "confirmed"}
            title={formatServiceName(nextJob.service_type)}
          />
        ) : (
          <DashboardEmptyCard
            body="When Mundoria offers you a session, it will appear here with area, time and earnings."
            title="No jobs lined up"
          />
        )}
      </DashboardSection>

      <section className="overflow-hidden rounded-[1.75rem] border border-[#e8e0d6]/80 bg-[#f3efe6] p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
              Medallion
            </p>
            <div className="mt-2">
              <TierBadge tier={cleaner.tier} />
            </div>
          </div>
          <Link
            className="text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
            href="/cleaner/performance"
          >
            View details
          </Link>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#312c79] to-[#d4694a]"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-light text-[#3d3a48]">
          {hasCompletedJobs
            ? `${cleaner.performance_score}/100 toward ${cleanerTierLabel(next)}`
            : `Progress toward ${cleanerTierLabel(next)} starts after completed jobs and ratings.`}
        </p>
        <p className="mt-2 text-sm font-light text-[#3d3a48]">
          {streak === 0
            ? "Finish a visit to start a streak. A cancellation or a missed visit sets it back to zero."
            : "A cancellation or a missed visit sets the streak back to zero."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat
            label="Rating"
            value={hasCompletedJobs ? `${cleaner.rating}/5` : "No ratings yet"}
          />
          <MiniStat
            label="On time"
            value={hasCompletedJobs ? `${cleaner.on_time_rate}%` : "No jobs yet"}
          />
          <MiniStat
            label="Acceptance"
            value={
              hasCompletedJobs || Number(cleaner.acceptance_rate) !== 100
                ? `${cleaner.acceptance_rate}%`
                : "No offers yet"
            }
          />
          <MiniStat
            label="Streak"
            value={streak === 0 ? "None yet" : `${streak} in a row`}
          />
        </div>
      </section>
      </div>

      <DashboardSection eyebrow="Done & dusted" title="Recent completed">
        <DashboardHistoryList
          actionHref="/cleaner/jobs"
          actionLabel="All jobs"
          emptyBody="Completed sessions will show here with earnings."
          emptyTitle="No completed jobs yet"
          rows={recent.map((job) => ({
            amount: job.amount_cleaner ? formatMoney(job.amount_cleaner) : "—",
            date: new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString(
              "en-GB",
              { day: "numeric", month: "short", year: "numeric" },
            ),
            href: `/cleaner/job/${job.id}`,
            person: job.address?.city ?? "—",
            service: formatServiceName(job.service_type),
            status: "Completed",
          }))}
        />
      </DashboardSection>
    </div>
  );
}

function heroLine(moment: CleanerHeroMoment, streak: number) {
  if (moment === "offer") return "There’s an offer waiting for an answer.";
  if (moment === "visit") return "You have a visit today.";
  if (moment === "streak") {
    return streak === 1
      ? "One finished visit in a row."
      : `${streak} finished visits in a row.`;
  }
  return "Nothing on today. A clear diary.";
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#c79c66]">
        {label}
      </dt>
      <dd className="mt-1 truncate text-base font-semibold tracking-tight text-[#1c133b] sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

function visitStreak(jobs: { scheduled_date: string; scheduled_start_time: string; status: string }[]) {
  const ordered = jobs
    .filter((job) => ["completed", "cancelled", "no_show"].includes(job.status))
    .sort((left, right) =>
      `${right.scheduled_date}T${right.scheduled_start_time}`.localeCompare(
        `${left.scheduled_date}T${left.scheduled_start_time}`,
      ),
    );
  let count = 0;
  for (const job of ordered) {
    if (job.status !== "completed") break;
    count += 1;
  }
  return count;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white/70 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-[#1c133b]">
        {value}
      </p>
    </div>
  );
}
