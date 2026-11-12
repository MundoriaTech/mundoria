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
  cleanerId,
  detail,
  documents,
  kind,
  note,
  open,
  onToggle,
  status,
}: {
  cleanerId: string;
  detail: string;
  documents: DocFile[];
  kind: CleanerDocumentKind;
  note?: string | null;
  open: boolean;
  onToggle: () => void;
  status: string;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [reason, setReason] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = CLEANER_DOCUMENT_LABELS[kind];
  const hasUpload = documents.some((doc) => Boolean(doc.url));
  const reasonOk = reason.trim().length >= 3;
  const decided = status === "verified" || status === "rejected";

  async function review(decision: "verified" | "rejected") {
    if (!reasonOk) {
      setError("Add a short note (at least 3 characters) before deciding.");
      return;
    }
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({
        action: "review_document",
        document_decision: decision,
        document_kind: kind,
        reason: reason.trim(),
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
      note: "The cleaner is notified when a document is rejected.",
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
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Review note
            </span>
            <Input
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                decided
                  ? "Update the note if you change this decision"
                  : `e.g. ${label} clear and matches the application`
              }
              value={reason}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="min-h-10"
              disabled={busy || !reasonOk}
              onClick={() => void review("verified")}
              type="button"
            >
              Approve
            </Button>
            <Button
              className="min-h-10"
              disabled={busy || !reasonOk}
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
