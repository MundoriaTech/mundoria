import { BriefcaseBusiness, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationStatus } from "@/components/cleaner/application-status";
import { ConnectPayoutCard } from "@/components/cleaner/connect-payout-card";
import { CleanerMedallionPanel } from "@/components/cleaner/medallion-panel";
import { CleanerOfferActions } from "@/components/cleaner/offer-highlight";
import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { LocationTile, TimeTile } from "@/components/customer/dashboard/tiles";
import { CleanCountdown } from "@/components/shared/clean-countdown";
import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import {
  getAvailableJobs,
  getCleanerContext,
  getCleanerJobs,
} from "@/lib/cleaner/server";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import { isAwaitingApproval } from "@/lib/cleaner/approval";
import { createServerClient } from "@/lib/supabase/server";
import { refreshCleanerStripeStatus } from "@/lib/stripe/cleaner-connect";

export const metadata = { title: "Cleaner dashboard" };

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

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
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "there";
  if (isAwaitingApproval(cleaner)) {
    return <ApplicationStatus cleaner={cleaner} firstName={firstName} />;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const activeJobs = jobs
    .filter((job) => !["cancelled", "completed"].includes(job.status))
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const todayJobs = activeJobs.filter((job) => job.scheduled_date === today);
  const current =
    jobs.find((job) => job.status === "in_progress") ??
    jobs.find((job) => {
      if (job.status !== "cleaner_en_route") return false;
      const start = new Date(
        `${job.scheduled_date}T${job.scheduled_start_time}`,
      ).getTime();
      return start - now.getTime() <= 3 * 60 * 60 * 1000;
    }) ??
    null;
  const upcoming = activeJobs.filter(
    (job) =>
      new Date(`${job.scheduled_date}T${job.scheduled_start_time}`) >= now,
  );
  const topOffer = available[0] ?? null;
  const featured = topOffer ?? current ?? upcoming[0] ?? activeJobs[0] ?? null;

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
  const streak = visitStreak(jobs);

  const sessionTitle = topOffer
    ? "Offer waiting"
    : current
      ? "Current session"
      : "Next session";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <LiveDashboardRefresh
        scope={`cleaner-dashboard-${user.id}`}
        watches={bookingWatchesFor("cleaner")}
      />

      {(cleaner.status === "certified" || cleaner.status === "active") &&
      !cleaner.stripe_onboarding_complete ? (
        <ConnectPayoutCard
          hasStripeAccount={Boolean(profile.stripe_account_id)}
          stripeComplete={cleaner.stripe_onboarding_complete}
        />
      ) : null}

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <SectionBanner className="xl:flex-1" title={sessionTitle} />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap xl:flex-nowrap">
            <Link
              className={`${pillPrimary} col-span-2`}
              href="/cleaner/jobs"
              style={pillPrimaryStyle}
            >
              <BriefcaseBusiness className="h-5 w-5" strokeWidth={2} />
              View jobs
            </Link>
            <Link
              className={`${pillOutline} ${featured && !topOffer ? "" : "col-span-2"}`}
              href="/cleaner/earnings"
            >
              <CalendarCheck className="h-5 w-5" strokeWidth={1.8} />
              Earnings
            </Link>
            {featured && !topOffer ? (
              <Link className={pillOutline} href={`/cleaner/job/${featured.id}`}>
                {current ? "Open session" : "Open job"}
              </Link>
            ) : null}
          </div>
        </div>

        {topOffer ? (
          <CleanerOfferActions job={topOffer} />
        ) : current?.status === "in_progress" ? (
          <CleanCountdown
            bookingId={current.id}
            durationHours={current.estimated_duration_hours}
            role="cleaner"
            startedAt={current.actual_start_time}
          />
        ) : current ? (
          <p className="m-0 text-[15px] font-semibold text-[#524096]">
            You&apos;re on the way.
          </p>
        ) : null}

        {featured ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#F3F4F6] p-5">
                <p className={tileLabel}>Service</p>
                <p className="m-0 mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#523F97] sm:text-[26px]">
                  {bookingServiceName(featured)}
                </p>
              </div>
              <div className="rounded-[18px] bg-[#F3F4F6] p-5">
                <p className={tileLabel}>Your pay</p>
                <p className="m-0 mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#523F97] sm:text-[26px]">
                  {featured.amount_cleaner
                    ? formatMoney(featured.amount_cleaner)
                    : "TBC"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <CalendarTile booking={featured} />
              <TimeTile booking={featured} />
              <div className="sm:col-span-2 xl:col-span-1">
                <LocationTile booking={featured} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="m-0 text-[17px] font-semibold text-[#1E1848]">
              No jobs lined up
            </p>
            <p className="m-0 mt-2 text-[14px] leading-5 text-[#5F5F66]">
              When Mundoria offers you a session, date, arrival and location will show here.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <SectionBanner title="Your week" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Today" value={String(todayJobs.length)} />
          <StatTile label="This week" value={formatMoney(week)} />
          <StatTile label="This month" value={formatMoney(month)} />
          <StatTile
            label="Streak"
            value={streak === 0 ? "None yet" : `${streak} in a row`}
          />
        </div>

        <CleanerMedallionPanel
          acceptanceRate={cleaner.acceptance_rate}
          avatarUrl={profile.avatar_url}
          name={profile.full_name}
          onTimeRate={cleaner.on_time_rate}
          performanceScore={cleaner.performance_score}
          rating={cleaner.rating}
          seed={profile.id}
          tier={cleaner.tier}
          totalJobs={cleaner.total_jobs}
        />
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#F3F4F6] p-4">
      <p className={tileLabel}>{label}</p>
      <p className="m-0 mt-2 truncate text-[20px] font-semibold tracking-[-0.02em] text-[#1E1848]">
        {value}
      </p>
    </div>
  );
}

function visitStreak(
  jobs: { scheduled_date: string; scheduled_start_time: string; status: string }[],
) {
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
