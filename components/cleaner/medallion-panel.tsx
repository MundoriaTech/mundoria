import Link from "next/link";

import { MedallionAvatar } from "@/components/shared/medallion-avatar";
import {
  cleanerTierLabel,
  isTopMedallionTier,
  nextTier,
  normalizeMedallionTier,
  TIER_REQUIREMENTS,
} from "@/lib/cleaner/tier";
import type { CleanerTier } from "@/types/cleaner";

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

/** Medallion progress for the cleaner dashboard. */
export function CleanerMedallionPanel({
  acceptanceRate,
  avatarUrl,
  name,
  onTimeRate,
  performanceScore,
  rating,
  seed,
  tier,
  totalJobs,
}: {
  acceptanceRate: number;
  avatarUrl?: string | null;
  name: string;
  onTimeRate: number;
  performanceScore: number;
  rating: number;
  seed?: string | null;
  tier: CleanerTier;
  totalJobs: number;
}) {
  const current = normalizeMedallionTier(tier);
  const label = cleanerTierLabel(tier === "elite" ? "elite" : current);
  const next = nextTier(current);
  const atTop = isTopMedallionTier(current);
  const requirement = TIER_REQUIREMENTS[next];
  const hasCompletedJobs = totalJobs > 0;
  const targetScore = requirement.score;
  const progress = atTop
    ? 100
    : !hasCompletedJobs
      ? 0
      : targetScore <= 0
        ? performanceScore >= targetScore
          ? 100
          : 0
        : Math.min(100, Math.max(0, (performanceScore / targetScore) * 100));

  const nextLabel = cleanerTierLabel(next);
  const progressCopy = atTop
    ? "Top of the ladder"
    : !hasCompletedJobs
      ? `Progress toward ${nextLabel} starts after completed jobs and ratings.`
      : targetScore > 0
        ? performanceScore >= targetScore
          ? `Score ${performanceScore}/100 · ${nextLabel} needs ${targetScore}+ (met)`
          : `Score ${performanceScore}/100 · ${nextLabel} needs ${targetScore}+`
        : `Score ${performanceScore}/100`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <MedallionAvatar
            avatarUrl={avatarUrl}
            name={name}
            seed={seed}
            size="lg"
            tier={tier}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#1E1848]">
                {label}
              </p>
              <Link
                className="text-[13.5px] font-semibold text-[#524096] no-underline hover:underline"
                href="/cleaner/performance"
              >
                Details
              </Link>
            </div>
            <p className="m-0 mt-1 text-[13.5px] leading-5 text-[#5F5F66]">
              {progressCopy}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#524096]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          label="Rating"
          value={hasCompletedJobs ? `${rating}/5` : "No ratings yet"}
        />
        <MiniStat
          label="On time"
          value={hasCompletedJobs ? `${onTimeRate}%` : "No jobs yet"}
        />
        <MiniStat
          label="Acceptance"
          value={
            hasCompletedJobs || Number(acceptanceRate) !== 100
              ? `${acceptanceRate}%`
              : "No offers yet"
          }
        />
        <MiniStat
          label="Jobs"
          value={hasCompletedJobs ? String(totalJobs) : "None yet"}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[#F3F4F6] px-3.5 py-3">
      <p className={tileLabel}>{label}</p>
      <p className="m-0 mt-1.5 text-[14px] font-semibold text-[#1E1848]">{value}</p>
    </div>
  );
}
