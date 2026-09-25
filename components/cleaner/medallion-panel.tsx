import Link from "next/link";
import { Award, Crown, Medal, Shield, Sparkle } from "lucide-react";

import {
  cleanerTierLabel,
  isTopMedallionTier,
  nextTier,
  normalizeMedallionTier,
  TIER_REQUIREMENTS,
} from "@/lib/cleaner/tier";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

const TIER_ICON: Record<CleanerTier, typeof Medal> = {
  bronze: Shield,
  silver: Medal,
  gold: Award,
  rose_gold: Sparkle,
  elite: Crown,
};

const TIER_FACE: Record<CleanerTier, string> = {
  bronze: "from-[#b87333] via-[#e8c09a] to-[#8c5a2b]",
  silver: "from-[#a8adb6] via-[#f4f5f7] to-[#8b9098]",
  gold: "from-[#d4a017] via-[#fff1a8] to-[#b8860b]",
  rose_gold: "from-[#c97b84] via-[#f7d4cb] to-[#a85c68]",
  elite: "from-[#4a3d8a] via-[#c4b5fd] to-[#31275f]",
};

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
  const Icon = TIER_ICON[current];
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
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[#1c133b] shadow-inner",
            TIER_FACE[current],
          )}
        >
          <Icon aria-hidden className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8798]">
              Activity insights
            </p>
            <span className="rounded-full bg-[#f3f1f7] px-2 py-0.5 text-[11px] font-bold text-[#1c133b]">
              {label}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-bold text-[#1c133b]">
            {progressCopy}
          </p>
        </div>
        <Link
          className="shrink-0 text-xs font-bold text-[#d4694a]"
          href="/cleaner/performance"
        >
          View
        </Link>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0edf5]">
        <div
          className="h-full rounded-full bg-[#d4694a] transition-[width] duration-500"
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
      <p className="mt-0.5 text-sm font-bold text-[#1c133b]">{value}</p>
    </div>
  );
}
