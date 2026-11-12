"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_INTERVIEW_STATUS_LABEL,
  adminCleanerStatusLabel,
} from "@/lib/admin/cleaner-status";
import { formatInterviewSlot } from "@/lib/cleaner/interview-slots";
import { cn } from "@/lib/utils";
import type { CleanerTier, InterviewStatus } from "@/types/cleaner";

const STATUS_AFTER: Record<string, string> = {
  approve: "certified",
  reject: "in_training",
  suspend: "suspended",
  remove: "removed",
  fail_interview: "in_training",
};

type ReadinessItem = {
  done: boolean;
  label: string;
  detail?: string;
};

export function CleanerReviewPanel({
  bio,
  cleanerId,
  currentStatus,
  currentTier,
  hasHeadshot,
  hasUtr,
  onboardingComplete = true,
  interviewScheduledAt = null,
  interviewStatus,
  medallionScore,
  skillsAssessmentStatus = null,
  skillsExamPassed,
  skillsExamScore,
  specialistReviewRequired = false,
  totalJobs,
  yearsExperience,
}: {
  bio: string | null;
  cleanerId: string;
  currentStatus: string;
  currentTier: CleanerTier;
  hasHeadshot: boolean;
  hasUtr: boolean;
  onboardingComplete?: boolean;
  interviewScheduledAt?: string | null;
  interviewStatus: InterviewStatus;
  medallionScore: number;
  skillsAssessmentStatus?: string | null;
  skillsExamPassed: boolean;
  skillsExamScore: number | null;
  specialistReviewRequired?: boolean;
  totalJobs: number;
  yearsExperience: number;
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [interview, setInterview] = useState(interviewStatus);
  const [tier, setTier] = useState<CleanerTier>(currentTier);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasonIsValid = reason.trim().length >= 3;

  useEffect(() => setStatus(currentStatus), [currentStatus]);
  useEffect(() => setTier(currentTier), [currentTier]);
  useEffect(() => setInterview(interviewStatus), [interviewStatus]);

  async function act(action: string) {
    const needsNote =
      action === "reject" ||
      action === "request_info" ||
      action === "fail_interview" ||
      action === "suspend" ||
      action === "remove";
    if (needsNote && !reasonIsValid) {
      setMessage("Add a short note explaining this decision for the cleaner.");
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
      body: JSON.stringify({
        action,
        ...(needsNote || reason.trim() ? { reason: reason.trim() } : {}),
        tier,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(result.error ?? "Couldn’t update this cleaner.");
      return;
    }

    const nextStatus = STATUS_AFTER[action];
    if (nextStatus) setStatus(nextStatus);
    if (action === "approve") setTier("silver");
    if (action === "complete_interview") setInterview("completed");
    if (action === "fail_interview") setInterview("failed");
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
                : action === "complete_interview"
                  ? "Onboarding call completed"
                  : action === "approve_skills"
                    ? "Specialist skills approved"
                    : action === "request_info"
                      ? "More information requested"
                      : action === "fail_interview"
                        ? "Onboarding call: didn’t proceed"
                        : "Cleaner updated",
      note: "The decision is logged against this account.",
    });
    router.refresh();
  }

  const isCertified = status === "certified" || status === "active";
  const interviewDone = interview === "completed";
  const readiness: ReadinessItem[] = [
    {
      done: onboardingComplete,
      label: "Application submitted",
      detail: onboardingComplete
        ? undefined
        : "Documents and answers are not on this page yet.",
    },
    {
      done: interviewDone,
      label: "Onboarding call",
      detail: interviewScheduledAt
        ? `${ADMIN_INTERVIEW_STATUS_LABEL[interview]} · ${formatInterviewSlot(interviewScheduledAt)}`
        : ADMIN_INTERVIEW_STATUS_LABEL[interview],
    },
    {
      done: skillsExamPassed,
      label: "Skills exam",
      detail: skillsExamPassed
        ? `Passed${skillsExamScore != null ? ` (${skillsExamScore})` : ""}`
        : "Not passed",
    },
    {
      done: hasHeadshot,
      label: "Profile photo",
      detail: hasHeadshot ? "Uploaded" : "Missing",
    },
    {
      done: hasUtr,
      label: "UTR",
      detail: hasUtr ? "Provided" : "Missing",
    },
  ];
  const approvalBlockers = readiness
    .filter((item) => !item.done)
    .map((item) => item.detail ?? `${item.label} still needed`);
  const canApprove = approvalBlockers.length === 0 && !isCertified;
  const showInterviewActions =
    interview !== "completed" && interview !== "failed";

  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-sm sm:text-base">{bio || "No bio yet."}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {yearsExperience} years experience
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:gap-3">
          <Metric label="Score" value={medallionScore} />
          <Metric label="Jobs" value={totalJobs} />
        </div>

        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-semibold">Onboarding readiness</h3>
          <ul className="mt-3 space-y-2">
            {readiness.map((item) => (
              <li
                className="flex items-start gap-2.5 text-sm"
                key={item.label}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    item.done
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900",
                  )}
                >
                  {item.done ? "✓" : "!"}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                  {item.detail ? (
                    <span className="mt-0.5 block text-muted-foreground">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Decide</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the onboarding call, then go live after documents are
          approved. Notes are only needed when telling the cleaner something
          went wrong.
        </p>

        {showInterviewActions ? (
          <DecisionPhase
            step="1"
            title="Onboarding call"
            hint={
              interviewScheduledAt
                ? `Booked for ${formatInterviewSlot(interviewScheduledAt)}`
                : "Mark the outcome after the call"
            }
          >
            <Button
              className="min-h-11 w-full"
              disabled={busy}
              onClick={() => void act("complete_interview")}
            >
              Mark call complete
            </Button>
            <label className="mt-1 block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Note if they didn’t proceed
              </span>
              <Input
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Could not verify identity on the call"
                value={reason}
              />
            </label>
            <Button
              className="min-h-11 w-full"
              disabled={busy || !reasonIsValid}
              onClick={() => void act("fail_interview")}
              variant="outline"
            >
              Didn’t proceed
            </Button>
          </DecisionPhase>
        ) : null}

        <DecisionPhase
          step={showInterviewActions ? "2" : "1"}
          title="Go live"
          hint={
            isCertified
              ? `Already ${adminCleanerStatusLabel(status).toLowerCase()}`
              : "Requires each uploaded document to be approved first, then starts them on silver"
          }
        >
          <Button
            className="min-h-11 w-full"
            disabled={busy || !canApprove}
            onClick={() => void act("approve")}
          >
            {isCertified ? "Already approved" : "Approve for live jobs"}
          </Button>
          {!isCertified && approvalBlockers.length > 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Waiting on:{" "}
              {readiness
                .filter((item) => !item.done)
                .map((item) => item.label.toLowerCase())
                .join(", ")}
              .
            </p>
          ) : null}
          {specialistReviewRequired &&
          skillsAssessmentStatus !== "approved" ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              <p className="font-medium">Specialist skills pending</p>
              <p className="mt-1 text-amber-900/80">
                Excluded from specialist services until approved.
              </p>
              <Button
                className="mt-3 min-h-11 w-full"
                disabled={busy}
                onClick={() => void act("approve_skills")}
                variant="outline"
              >
                Approve specialist skills
              </Button>
            </div>
          ) : null}
        </DecisionPhase>

        <DecisionPhase
          step={showInterviewActions ? "3" : "2"}
          title="Follow up"
          hint="Note is shared with the cleaner"
        >
          <Input
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Please re-upload a clearer DBS certificate"
            value={reason}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              className="min-h-11"
              disabled={busy || !reasonIsValid}
              onClick={() => void act("request_info")}
              variant="outline"
            >
              Request more info
            </Button>
            <Button
              className="min-h-11"
              disabled={busy || !reasonIsValid}
              onClick={() => void act("reject")}
              variant="outline"
            >
              Keep on hold
            </Button>
          </div>
        </DecisionPhase>

        <DecisionPhase
          step={showInterviewActions ? "4" : "3"}
          title="Restrict account"
          hint="Note is required and logged"
        >
          <Input
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Repeated no-shows after warnings"
            value={reason}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              className="min-h-11"
              disabled={busy || !reasonIsValid}
              onClick={() => void act("suspend")}
              variant="outline"
            >
              Suspend
            </Button>
            <Button
              className="min-h-11"
              disabled={busy || !reasonIsValid}
              onClick={() => void act("remove")}
              variant="destructive"
            >
              Ban
            </Button>
          </div>
        </DecisionPhase>

        {message ? (
          <div className="mt-3">
            <ActionError
              message={message}
              title="Couldn’t update this cleaner"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DecisionPhase({
  children,
  hint,
  step,
  title,
}: {
  children: ReactNode;
  hint?: string;
  step: string;
  title: string;
}) {
  return (
    <div className="mt-5 border-t pt-4">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {step}
        </span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {hint ? (
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
      <div className="grid gap-2">{children}</div>
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
