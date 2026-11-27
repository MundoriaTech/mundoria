import { redirect } from "next/navigation";

import { RatingDisputeList } from "@/components/cleaner/rating-dispute-list";
import { SectionHeading } from "@/components/customer/dashboard/section-banner";
import { MedallionAvatar } from "@/components/shared/medallion-avatar";
import { getCleanerContext } from "@/lib/cleaner/server";
import {
  cleanerTierLabel,
  isTopMedallionTier,
  nextTier,
  normalizeMedallionTier,
  TIER_REQUIREMENTS,
} from "@/lib/cleaner/tier";
import { createServerClient } from "@/lib/supabase/server";
import type { PerformanceHistory } from "@/types/cleaner";

export const metadata = { title: "Performance" };

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

export default async function CleanerPerformancePage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [context, { data: history }, { data: heldRatings }] = await Promise.all([
    getCleanerContext(supabase, user.id),
    supabase
      .from("performance_history")
      .select("*")
      .eq("cleaner_id", user.id)
      .order("month"),
    supabase
      .from("ratings")
      .select("id,booking_id,mood,dispute_deadline")
      .eq("cleaner_id", user.id)
      .eq("application_status", "pending_hold")
      .order("dispute_deadline"),
  ]);
  const cleaner = context.cleanerProfile;
  const profile = context.profile;
  if (!cleaner || !profile) redirect("/");
  const current = normalizeMedallionTier(cleaner.tier);
  const atTop = isTopMedallionTier(cleaner.tier);
  const next = nextTier(current);
  const nextLabel = cleanerTierLabel(next);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = cleaner.total_jobs > 0;
  const score = Number(cleaner.performance_score);
  const scoreThreshold = requirement.score;
  const scoreMet = hasCompletedJobs && score >= scoreThreshold;
  const cancellationReliability = Math.max(
    0,
    100 - cleaner.cancellation_count * 10,
  );
  const months = (history ?? []) as PerformanceHistory[];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <RatingDisputeList ratings={heldRatings ?? []} />

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <div className="flex flex-col gap-4 rounded-[18px] bg-[#F3F4F6] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-4">
            <MedallionAvatar
              avatarUrl={profile.avatar_url}
              name={profile.full_name}
              seed={profile.id}
              size="lg"
              tier={cleaner.tier}
            />
            <div className="min-w-0">
              <p className={tileLabel}>Current tier</p>
              <p className="m-0 mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-[#1E1848]">
                {cleanerTierLabel(cleaner.tier)} medallion
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className={tileLabel}>Total score</p>
            {hasCompletedJobs ? (
              <p className="m-0 mt-1.5 text-[34px] font-semibold leading-none tracking-[-0.03em] text-[#523F97]">
                {cleaner.performance_score}
                <span className="text-[16px] font-semibold text-[#8B8798]">
                  /100
                </span>
              </p>
            ) : (
              <p className="m-0 mt-1.5 text-[18px] font-semibold text-[#1E1848]">
                No data yet
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
            label="Reliability · cancelling often means fewer new offers"
            value={hasCompletedJobs ? cancellationReliability : null}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading
          title={atTop ? "Medallion ladder" : `Progress to ${nextLabel}`}
        />
        <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
          {atTop ? (
            <p className="m-0 text-[14px] leading-5 text-[#5F5F66]">
              You’re at the top of the ladder. Keep your score strong to stay
              there.
            </p>
          ) : (
            <>
              {requirement.rating > 0 ? (
                <Progress
                  label={
                    hasCompletedJobs
                      ? `Rating ${cleaner.rating} / ${requirement.rating} needed`
                      : "Rating starts after customer reviews"
                  }
                  value={
                    hasCompletedJobs
                      ? (cleaner.rating / requirement.rating) * 100
                      : 0
                  }
                />
              ) : null}
              {requirement.jobs > 0 ? (
                <Progress
                  label={`Jobs ${cleaner.total_jobs} / ${requirement.jobs} needed`}
                  value={(cleaner.total_jobs / requirement.jobs) * 100}
                />
              ) : null}
              <Progress
                label={
                  !hasCompletedJobs
                    ? "Score starts after completed jobs"
                    : scoreMet
                      ? `Score ${score} / 100 · ${nextLabel} needs ${scoreThreshold}+ (met)`
                      : `Score ${score} / 100 · ${nextLabel} needs ${scoreThreshold}+`
                }
                value={
                  !hasCompletedJobs
                    ? 0
                    : scoreThreshold <= 0
                      ? scoreMet
                        ? 100
                        : 0
                      : (score / scoreThreshold) * 100
                }
              />
            </>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Monthly performance" />
        {months.length ? (
          <div className="rounded-[18px] bg-[#F3F4F6] px-4 pb-4 pt-6 sm:px-5">
            <div className="flex h-48 items-end gap-2.5 sm:gap-3">
              {months.map((item) => (
                <div
                  className="flex min-w-0 flex-1 flex-col items-center"
                  key={item.id}
                >
                  <div
                    className="w-full max-w-[2.5rem] rounded-t-[8px]"
                    style={{
                      background:
                        "linear-gradient(180deg, #6A5BA6 0%, #524096 100%)",
                      height: `${Math.max(4, item.total_score)}%`,
                    }}
                  />
                  <span className="mt-2 truncate text-[10px] font-medium text-[#8B8798]">
                    {item.month.slice(0, 7)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
              No monthly history yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#6B6B70]">
              Monthly history appears after your first review cycle.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Reliability history" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
            <p className={tileLabel}>Cancellations</p>
            <p className="m-0 mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#1E1848]">
              {cleaner.cancellation_count}
            </p>
          </div>
          <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
            <p className={tileLabel}>No-shows</p>
            <p className="m-0 mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#1E1848]">
              {cleaner.no_show_count}
            </p>
          </div>
        </div>
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
    <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
      <p className="m-0 text-[13px] leading-5 text-[#5F5F66]">{label}</p>
      <p className="m-0 mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#1E1848]">
        {value === null ? "Not enough data" : `${Number(value).toFixed(1)}%`}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#524096]"
          style={{ width: `${width}%` }}
        />
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
    <div className="mt-4 first:mt-0">
      <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
        <span className="font-medium text-[#1E1848]">{label}</span>
        <span className="shrink-0 font-semibold text-[#524096]">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#524096]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
