"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { cleanerTierLabel } from "@/lib/cleaner/tier";
import type { CleanerTier } from "@/types/cleaner";

const STATUS_AFTER: Record<string, string> = {
  approve: "certified",
  reject: "in_training",
  suspend: "suspended",
  remove: "removed",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Needs review",
  in_training: "On hold",
  certified: "Approved",
  active: "Approved",
  suspended: "Suspended",
  removed: "Banned",
};

export function CleanerReviewPanel({
  bio,
  cleanerId,
  currentStatus,
  currentTier,
  medallionScore,
  totalJobs,
  yearsExperience,
}: {
  bio: string | null;
  cleanerId: string;
  currentStatus: string;
  currentTier: CleanerTier;
  medallionScore: number;
  totalJobs: number;
  yearsExperience: number;
}) {
  const router = useRouter();
  const { confirm, error: showError, success } = useFeedback();
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [tier, setTier] = useState<CleanerTier>(currentTier);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasonIsValid = reason.trim().length >= 3;

  useEffect(() => setStatus(currentStatus), [currentStatus]);
  useEffect(() => setTier(currentTier), [currentTier]);

  async function act(action: string) {
    if (!reasonIsValid) {
      setMessage("Add a short note first (why you’re doing this).");
      return;
    }

    if (action === "suspend" || action === "remove") {
      const ok = await confirm({
        action: action === "suspend" ? "Suspend cleaner" : "Ban cleaner",
        description:
          action === "suspend"
            ? "They won’t receive new jobs until you reinstate them."
            : "This bans the cleaner from the platform. Be sure the note covers why.",
        title:
          action === "suspend" ? "Suspend this cleaner?" : "Ban this cleaner?",
        variant: "destructive",
      });
      if (!ok) return;
    }

    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({ action, reason, tier }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      const errorMessage = result.error ?? "Action failed.";
      setMessage(errorMessage);
      showError({
        description: errorMessage,
        title: "Couldn’t update cleaner",
      });
      return;
    }

    const nextStatus = STATUS_AFTER[action];
    if (nextStatus) setStatus(nextStatus);
    if (action === "approve") setTier("silver");
    setMessage(null);
    success({
      kind: "done",
      title:
        action === "approve"
          ? "Cleaner approved"
          : action === "reject"
            ? "Cleaner put on hold"
            : action === "suspend"
              ? "Cleaner suspended"
              : action === "remove"
                ? "Cleaner banned"
                : "Cleaner updated",
      note: "The decision is logged against this account.",
    });
    router.refresh();
  }

  const isCertified = status === "certified" || status === "active";
  const statusLabel = STATUS_LABEL[status] ?? status.replaceAll("_", " ");

  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_.65fr]">
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm sm:text-base">{bio || "No bio yet."}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {yearsExperience} years experience
            </p>
          </div>
          <TierBadge size="sm" tier={tier} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
          <Metric label="Score" value={medallionScore} />
          <Metric label="Jobs" value={totalJobs} />
          <Metric label="Status" value={statusLabel} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Decide</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check their documents, then approve them for live jobs — or hold /
              remove the account. A short note is kept for your records.
            </p>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground sm:shrink-0 sm:flex-col sm:text-right">
            <p>
              Status:{" "}
              <span className="font-medium text-foreground">{statusLabel}</span>
            </p>
            <p>
              Tier:{" "}
              <span className="font-medium text-foreground">
                {cleanerTierLabel(tier)}
              </span>
            </p>
          </div>
        </div>

        <Input
          className="mt-4"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Note, e.g. DBS and ID checked"
          value={reason}
        />

        <div className="mt-4 grid gap-2">
          <Button
            className="min-h-11"
            disabled={!reasonIsValid || busy || isCertified}
            onClick={() => void act("approve")}
          >
            {isCertified ? "Already approved" : "Approve for live jobs"}
          </Button>
          <Button
            className="min-h-11"
            disabled={!reasonIsValid || busy}
            onClick={() => void act("reject")}
            variant="outline"
          >
            Keep on hold
          </Button>
          <Button
            className="min-h-11"
            disabled={!reasonIsValid || busy}
            onClick={() => void act("suspend")}
            variant="outline"
          >
            Suspend temporarily
          </Button>
          <Button
            className="min-h-11"
            disabled={!reasonIsValid || busy}
            onClick={() => void act("remove")}
            variant="destructive"
          >
            Ban from platform
          </Button>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-medium">Tier (optional)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only change this if you need to adjust their performance tier later.
            New approvals start on silver automatically.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              className="h-11 w-full flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              onChange={(event) => setTier(event.target.value as CleanerTier)}
              value={tier}
            >
              {(["bronze", "silver", "gold", "rose_gold", "elite"] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {cleanerTierLabel(value)}
                  </option>
                ),
              )}
            </select>
            <Button
              className="min-h-11 w-full sm:w-auto"
              disabled={!reasonIsValid || busy}
              onClick={() => void act("set_tier")}
              variant="outline"
            >
              Update tier
            </Button>
          </div>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted p-2.5 sm:p-3">
      <b className="block break-words text-sm sm:text-base">{value}</b>
      <small className="block text-muted-foreground">{label}</small>
    </div>
  );
}
