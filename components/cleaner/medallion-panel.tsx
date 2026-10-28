import Link from "next/link";

import {
  cleanerTierLabel,
  isTopMedallionTier,
  medallionIconSrc,
  nextTier,
  normalizeMedallionTier,
  TIER_REQUIREMENTS,
} from "@/lib/cleaner/tier";
import type { CleanerTier } from "@/types/cleaner";

/** Glovo-style activity insights — compact scoring peek. */
export function CleanerMedallionPanel({
  acceptanceRate,
  onTimeRate,
  performanceScore,
  rating,
  tier,
  totalJobs,
}: {
  acceptanceRate: number;
  onTimeRate: number;
  performanceScore: number;
  rating: number;
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

  const progressCopy = atTop
    ? "Top of the ladder"
    : !hasCompletedJobs
      ? `Toward ${cleanerTierLabel(next)}`
      : targetScore > 0
        ? `${performanceScore}/${targetScore} → ${cleanerTierLabel(next)}`
        : `Score ${performanceScore}`;

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-[0_12px_32px_rgba(28,19,59,0.08)] ring-1 ring-black/[0.04] sm:p-5">
      <div className="flex items-center gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden
          className="h-12 w-12 shrink-0"
          src={medallionIconSrc(current)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-subtle">
              Activity insights
            </p>
            <span className="rounded-full bg-[#f3f1f7] px-2 py-0.5 text-[11px] font-bold text-brand-ink">
              {label}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-bold text-brand-ink">
            {progressCopy}
          </p>
        </div>
        <Link
          className="shrink-0 text-xs font-bold text-brand-terracotta"
          href="/cleaner/performance"
        >
          View
        </Link>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0edf5]">
        <div
          className="h-full rounded-full bg-brand-terracotta transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#f0edf5] pt-3.5 text-center">
        <Metric
          label="Rating"
          value={hasCompletedJobs ? `${rating}/5` : "—"}
        />
        <Metric
          label="On time"
          value={hasCompletedJobs ? `${onTimeRate}%` : "—"}
        />
        <Metric
          label="Accept"
          value={
            hasCompletedJobs || Number(acceptanceRate) !== 100
              ? `${acceptanceRate}%`
              : "—"
          }
        />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8a3b5]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-brand-ink">{value}</p>
    </div>
  );
}
