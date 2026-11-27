"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type HistoryEntry = {
  /** "edit" rows can be undone; "action" rows are other admin actions. */
  changes: Array<{ field: string; from: string; to: string }>;
  createdAt: string;
  id: string;
  kind: "edit" | "undo" | "action";
  reason: string | null;
  title: string;
  undoneAt: string | null;
  who: string;
};

type UndoPreview = {
  changes: Array<{ field: string; from: string; to: string }>;
  cleanerMustReconfirm: boolean;
  holdNeedsReplacing: boolean;
  newTotalPence: number;
  oldTotalPence: number;
};

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/London",
    year: "numeric",
  });
}

/**
 * Everything done to this booking after it was made: edits by admins and the
 * customer (with before → after), undos, and other admin actions with their
 * notes. The newest edit still in force can be undone.
 */
export function BookingEditHistory({
  bookingId,
  entries,
  hasCleaner,
  undoableId,
}: {
  bookingId: string;
  entries: HistoryEntry[];
  hasCleaner: boolean;
  undoableId: string | null;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [undoing, setUndoing] = useState<HistoryEntry | null>(null);
  const [note, setNote] = useState("");
  const [cleanerAgreed, setCleanerAgreed] = useState(false);
  const [preview, setPreview] = useState<UndoPreview | null>(null);
  const [error, setError] = useState("");

  async function call(previewOnly: boolean) {
    if (!undoing) return null;
    const res = await fetch(`/api/admin/bookings/${bookingId}/edits/${undoing.id}/undo`, {
      body: JSON.stringify({ cleanerAgreed, note, preview: previewOnly }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = (await res.json().catch(() => ({}))) as UndoPreview & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Couldn't undo this edit.");
      return null;
    }
    setError("");
    return json;
  }

  function close() {
    setUndoing(null);
    setPreview(null);
    setNote("");
    setCleanerAgreed(false);
    setError("");
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Edit history</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Changes made after booking, by admins or the customer, and other admin actions with their notes.
      </p>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing has been changed since this was booked.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li className="rounded-lg border border-border p-3 text-sm" key={`${entry.kind}-${entry.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {entry.title}
                    {entry.undoneAt ? (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Undone
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.who} · {when(entry.createdAt)}
                  </p>
                </div>
                {entry.id === undoableId ? (
                  <Button
                    onClick={() => {
                      setUndoing(entry);
                      setPreview(null);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Undo this edit
                  </Button>
                ) : null}
              </div>
              {entry.changes.length ? (
                <ul className="mt-2 space-y-0.5">
                  {entry.changes.map((change) => (
                    <li key={change.field}>
                      <span className="text-muted-foreground">{change.field}:</span> {change.from} →{" "}
                      <span className="font-medium">{change.to}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {entry.reason ? (
                <p className="mt-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span> {entry.reason}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {undoing ? (
        <ConfirmModal
          action={preview ? "Undo edit" : "Check undo"}
          confirmDisabled={note.trim().length < 3}
          description="The booking goes back to how it was before this edit. The customer, the cleaner and admins are told."
          onCancel={close}
          onConfirm={async () => {
            if (!preview) {
              const result = await call(true);
              if (result) setPreview(result);
              return;
            }
            const result = await call(false);
            if (!result) return;
            success({ kind: "updated", note: "Everyone affected has been told.", title: "Edit undone" });
            close();
            router.refresh();
          }}
          title="Undo this edit?"
          variant={preview ? "destructive" : "default"}
        >
          <div className="space-y-3 text-sm">
            <Input
              onChange={(event) => {
                setNote(event.target.value);
                setPreview(null);
              }}
              placeholder="Why are you undoing it? (required)"
              value={note}
            />
            {hasCleaner ? (
              <label className="flex items-start gap-2">
                <input
                  checked={cleanerAgreed}
                  className="mt-0.5 accent-primary"
                  onChange={(event) => {
                    setCleanerAgreed(event.target.checked);
                    setPreview(null);
                  }}
                  type="checkbox"
                />
                <span>
                  If the time or address goes back, I&apos;ve already agreed it with the cleaner (otherwise they&apos;re
                  asked to accept again).
                </span>
              </label>
            ) : null}
            {preview ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-semibold">What will change back</p>
                <ul className="mt-1 space-y-0.5">
                  {preview.changes.map((change) => (
                    <li key={change.field}>
                      <span className="text-muted-foreground">{change.field}:</span> {change.from} →{" "}
                      <span className="font-medium">{change.to}</span>
                    </li>
                  ))}
                </ul>
                {preview.holdNeedsReplacing ? (
                  <p className="mt-2 text-amber-800">
                    The card hold goes from {money(preview.oldTotalPence)} to {money(preview.newTotalPence)}. If the
                    bank refuses, nothing changes.
                  </p>
                ) : null}
                {preview.cleanerMustReconfirm ? (
                  <p className="mt-2 text-amber-800">The cleaner will be asked to accept the job again.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground">Click &ldquo;Check undo&rdquo; to see exactly what changes back.</p>
            )}
            {error ? <ActionError message={error} title="Couldn’t undo this edit" /> : null}
          </div>
        </ConfirmModal>
      ) : null}
    </section>
  );
}
