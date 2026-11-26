"use client";

import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DocumentViewerButton } from "@/components/admin/document-viewer";
import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CLEANER_DOCUMENT_LABELS,
  type CleanerDocumentKind,
} from "@/lib/cleaner/document-reviews";
import {
  RIGHT_TO_WORK_RESTRICTIONS,
  type RightToWorkRestriction,
} from "@/lib/cleaner/right-to-work";
import { cn } from "@/lib/utils";

type DocFile = {
  label: string;
  path: string | null;
  url: string | null;
};

export function DocumentReviewControls({
  checkLink,
  cleanerId,
  detail,
  documents,
  facts,
  kind,
  note,
  open,
  onToggle,
  requireWorkRestriction,
  reviewable,
  status,
  workRestriction,
}: {
  /** External check to do before deciding (e.g. GOV.UK right to work). */
  checkLink?: { href: string; label: string } | null;
  cleanerId: string;
  detail: string;
  documents: DocFile[];
  /** Labeled answers shown in the review panel (share code, dates). */
  facts?: Array<{ label: string; value: string }>;
  kind: CleanerDocumentKind;
  note?: string | null;
  open: boolean;
  onToggle: () => void;
  requireWorkRestriction?: boolean;
  /** Reviewable without a file (e.g. a right-to-work share code). */
  reviewable?: boolean;
  status: string;
  workRestriction?: RightToWorkRestriction | null;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [reason, setReason] = useState(note ?? "");
  const [restriction, setRestriction] = useState<RightToWorkRestriction | "">(
    workRestriction ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = CLEANER_DOCUMENT_LABELS[kind];
  const hasUpload =
    documents.some((doc) => Boolean(doc.url) || Boolean(doc.path)) ||
    Boolean(reviewable);
  const reasonOk = reason.trim().length >= 3;
  const decided = status === "verified" || status === "rejected";
  // Approved before the GOV.UK result was recorded: let the admin save it.
  const missingRestriction = Boolean(requireWorkRestriction) && !workRestriction;
  const approveLocked = status === "verified" && !missingRestriction;

  async function review(decision: "verified" | "rejected") {
    // Approving is one click; rejecting needs a reason the cleaner will see.
    if (decision === "rejected" && !reasonOk) {
      setError("Add a short reason so the cleaner knows what to fix.");
      return;
    }
    if (
      decision === "verified" &&
      requireWorkRestriction &&
      restriction !== "unrestricted" &&
      restriction !== "restricted"
    ) {
      setError(
        "Check the share code on GOV.UK, then mark restricted work or non-restricted work.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({
        action: "review_document",
        document_decision: decision,
        document_kind: kind,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(requireWorkRestriction && restriction
          ? { work_restriction: restriction }
          : {}),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Couldn’t save this document decision.");
      return;
    }
    success({
      kind: "done",
      note:
        decision === "verified"
          ? "The cleaner has been told it's approved."
          : "The cleaner has been told what to fix and can upload a new one.",
      title:
        decision === "verified" ? `${label} approved` : `${label} rejected`,
    });
    router.refresh();
  }

  return (
    <div className="py-2.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <p className="text-sm font-semibold text-foreground">{label}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {detail}
          </p>
          {note && !open ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              Note: {note}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {documents.some((document) => document.url || document.path) ? (
            <DocumentViewerButton
              className="h-9 px-3"
              files={documents}
              label="Open"
            />
          ) : null}
          {checkLink ? (
            <Button asChild className="h-9 px-3" variant="outline">
              <a href={checkLink.href} rel="noreferrer" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                {checkLink.label}
              </a>
            </Button>
          ) : null}
          {hasUpload ? (
            <Button
              aria-expanded={open}
              className="h-9 gap-1 px-3"
              onClick={onToggle}
              type="button"
              variant={open ? "secondary" : "outline"}
            >
              {decided ? "Re-review" : "Review"}
              <ChevronDown
                className={cn("h-4 w-4 transition", open && "rotate-180")}
              />
            </Button>
          ) : (
            <span className="inline-flex h-9 items-center gap-1.5 px-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Not uploaded
            </span>
          )}
        </div>
      </div>

      {open && hasUpload ? (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3">
          {facts && facts.length > 0 ? (
            <dl className="mb-3 grid gap-3 text-sm sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className="font-medium text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {requireWorkRestriction ? (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                After the GOV.UK check, this person may do
              </p>
              <div className="flex flex-wrap gap-2">
                {RIGHT_TO_WORK_RESTRICTIONS.map((option) => (
                  <Button
                    className="min-h-10"
                    key={option.value}
                    onClick={() => setRestriction(option.value)}
                    type="button"
                    variant={
                      restriction === option.value ? "secondary" : "outline"
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Note (optional to approve, required to reject)
            </span>
            <Input
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                decided
                  ? "Update the note if you change this decision"
                  : `Reason if rejecting, e.g. ${label} is blurry, please upload a clearer copy`
              }
              value={reason}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="min-h-10"
              disabled={
                busy ||
                approveLocked ||
                (requireWorkRestriction &&
                  restriction !== "unrestricted" &&
                  restriction !== "restricted")
              }
              onClick={() => void review("verified")}
              type="button"
            >
              {approveLocked
                ? "Approved"
                : status === "verified"
                  ? "Save GOV.UK result"
                  : "Approve"}
            </Button>
            <Button
              className="min-h-10"
              disabled={busy || status === "rejected" || !reasonOk}
              onClick={() => void review("rejected")}
              type="button"
              variant="outline"
            >
              Reject
            </Button>
          </div>
          {error ? (
            <div className="mt-3">
              <ActionError message={error} title="Document review failed" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "verified"
      ? "bg-emerald-100 text-emerald-900"
      : status === "rejected" || status === "expired"
        ? "bg-amber-100 text-amber-950"
        : status === "pending"
          ? "bg-sky-100 text-sky-950"
          : "bg-muted text-muted-foreground";
  const label =
    status === "verified"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : status === "pending"
          ? "Pending"
          : status === "expired"
            ? "Expired"
            : status === "missing"
              ? "Missing"
              : status.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone,
      )}
    >
      {label}
    </span>
  );
}
