import { BriefcaseBusiness, CalendarCheck } from "lucide-react";
import Link from "next/link";

import { TierBadge } from "@/components/cleaner/tier-badge";
import {
  DashboardEmptyCard,
  DashboardHistoryList,
  DashboardSection,
  DashboardStatTiles,
  DashboardWelcomeBanner,
  SessionHighlightCard,
} from "@/components/shared/dashboard-panels";
import { getCleanerContext, getCleanerJobs } from "@/lib/cleaner/server";
import { nextTier, TIER_REQUIREMENTS } from "@/lib/cleaner/tier";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { sessionPhotoForService } from "@/lib/customer/booking-visibility";
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
  const profile = context.profile;
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
  const next = nextTier(cleaner.tier);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = cleaner.total_jobs > 0;
  const tierProgress = requirement.score
    ? Math.min(100, (cleaner.performance_score / requirement.score) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-4">
      <DashboardWelcomeBanner
        actions={
          <>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3.5 text-xs font-semibold text-[#1c133b] shadow-[0_8px_20px_rgba(28,19,59,0.16)] transition hover:bg-[#f7f2ea] sm:h-12 sm:px-6 sm:text-sm"
              href="/cleaner/jobs"
            >
              <BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              View jobs
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/35 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/18 sm:h-12 sm:px-6 sm:text-sm"
              href="/cleaner/earnings"
            >
              <CalendarCheck className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Earnings
            </Link>
          </>
        }
        eyebrow="Mundoria Pro"
        firstName={firstName}
        subtitle="Your sessions, earnings and medallion progress — ready for a brilliant day."
      />

      <DashboardStatTiles
        items={[
          {
            icon: "calendarBlank",
            label: "Today",
            value: String(todayJobs.length),
          },
          {
            icon: "currencyGbp",
            label: "This week",
            tone: "lavenderOrange",
            value: formatMoney(week),
          },
          {
            icon: "currencyGbp",
            label: "This month",
            tone: "lineOnly",
            value: formatMoney(month),
          },
          {
            icon: "mapPin",
            label: "Next job",
            value: nextJob
              ? `${nextJob.scheduled_start_time.slice(0, 5)} · ${nextJob.address?.city ?? "Job"}`
              : "None",
          },
        ]}
      />

      <DashboardSection eyebrow="On the schedule" title="Next session">
        {nextJob ? (
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

      <section className="overflow-hidden rounded-[1.75rem] bg-[#f3efe6] p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
              Medallion
            </p>
            <div className="mt-2">
              <TierBadge tier={cleaner.tier} />
            </div>
          </div>
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-lg"
          >
            ★
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#312c79] to-[#d4694a]"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-light text-[#3d3a48]">
          {hasCompletedJobs
            ? `${cleaner.performance_score}/100 toward ${next}`
            : `Progress toward ${next} starts after completed jobs and ratings.`}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </div>
      </section>

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
