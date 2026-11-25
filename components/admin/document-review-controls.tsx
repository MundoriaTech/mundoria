"use client";

import { ChevronDown, FileText } from "lucide-react";
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
  kind,
  note,
  open,
  onToggle,
  reviewable,
  status,
}: {
  /** External check to do before deciding (e.g. GOV.UK right to work). */
  checkLink?: { href: string; label: string } | null;
  cleanerId: string;
  detail: string;
  documents: DocFile[];
  kind: CleanerDocumentKind;
  note?: string | null;
  open: boolean;
  onToggle: () => void;
  /** Reviewable without a file (e.g. a right-to-work share code). */
  reviewable?: boolean;
  status: string;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [reason, setReason] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = CLEANER_DOCUMENT_LABELS[kind];
  const hasUpload = documents.some((doc) => Boolean(doc.url)) || Boolean(reviewable);
  const reasonOk = reason.trim().length >= 3;
  const decided = status === "verified" || status === "rejected";

  async function review(decision: "verified" | "rejected") {
    // Approving is one click; rejecting needs a reason the cleaner will see.
    if (decision === "rejected" && !reasonOk) {
      setError("Add a short reason so the cleaner knows what to fix.");
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
          {documents.map((document) =>
            document.url ? (
              <DocumentViewerButton
                className="h-9 px-3"
                key={document.label}
                label={
                  documents.length > 1
                    ? document.label.replace(`${label} `, "")
                    : "Open"
                }
                path={document.path}
                url={document.url}
              />
            ) : null,
          )}
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
          {checkLink ? (
            <a
              className="mb-3 inline-flex text-sm font-semibold text-primary underline"
              href={checkLink.href}
              rel="noreferrer"
              target="_blank"
            >
              {checkLink.label}
            </a>
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
              disabled={busy || status === "verified"}
              onClick={() => void review("verified")}
              type="button"
            >
              {status === "verified" ? "Approved" : "Approve"}
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
