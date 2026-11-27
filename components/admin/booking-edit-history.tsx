"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";

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
  const [resetting, setResetting] = useState(false);
  const [note, setNote] = useState("");
  const [cleanerAgreed, setCleanerAgreed] = useState(false);
  const [preview, setPreview] = useState<UndoPreview | null>(null);
  const [error, setError] = useState("");

  async function call(previewOnly: boolean) {
    if (!undoing && !resetting) return null;
    const url = resetting
      ? `/api/admin/bookings/${bookingId}/reset`
      : `/api/admin/bookings/${bookingId}/edits/${undoing?.id}/undo`;
    const res = await fetch(url, {
      body: JSON.stringify({ cleanerAgreed, note, preview: previewOnly }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = (await res.json().catch(() => ({}))) as UndoPreview & { error?: string };
    if (!res.ok) {
      setError(json.error ?? (resetting ? "Couldn't reset this booking." : "Couldn't undo this edit."));
      return null;
    }
    setError("");
    return json;
  }

  function close() {
    setUndoing(null);
    setResetting(false);
    setPreview(null);
    setNote("");
    setCleanerAgreed(false);
    setError("");
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Edit history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes made after booking, by admins or the customer, and other admin actions with their notes.
          </p>
        </div>
        {undoableId ? (
          <Button
            onClick={() => {
              setUndoing(null);
              setResetting(true);
              setPreview(null);
            }}
            size="sm"
            variant="outline"
          >
            Reset to original booking
          </Button>
        ) : null}
      </div>
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

      {undoing || resetting ? (
        <ConfirmModal
          action={resetting ? (preview ? "Reset booking" : "Check reset") : preview ? "Undo edit" : "Check undo"}
          confirmDisabled={note.trim().length < 3}
          description={
            resetting
              ? "Every change still in force is reversed, so the booking goes back to what was originally booked. The customer, the cleaner and admins are told."
              : "The booking goes back to how it was before this edit. The customer, the cleaner and admins are told."
          }
          onCancel={close}
          onConfirm={async () => {
            if (!preview) {
              const result = await call(true);
              if (result) setPreview(result);
              return;
            }
            const result = await call(false);
            if (!result) return;
            success({
              kind: "updated",
              note: "Everyone affected has been told.",
              title: resetting ? "Booking reset to the original" : "Edit undone",
            });
            close();
            router.refresh();
          }}
          title={resetting ? "Reset to the original booking?" : "Undo this edit?"}
          variant={preview ? "destructive" : "default"}
        >
          <div className="space-y-3 text-sm">
            <Input
              onChange={(event) => {
                setNote(event.target.value);
                setPreview(null);
              }}
              placeholder={resetting ? "Why are you resetting it? (required)" : "Why are you undoing it? (required)"}
              value={note}
            />
            {hasCleaner ? (
              <label className="flex items-start gap-2">
                <RoundCheckbox
                  checked={cleanerAgreed}
                  className="mt-0.5"
                  onChange={(event) => {
                    setCleanerAgreed(event.target.checked);
                    setPreview(null);
                  }}
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
              <p className="text-muted-foreground">
                Click &ldquo;{resetting ? "Check reset" : "Check undo"}&rdquo; to see exactly what changes back.
              </p>
            )}
            {error ? (
              <ActionError message={error} title={resetting ? "Couldn’t reset this booking" : "Couldn’t undo this edit"} />
            ) : null}
          </div>
        </ConfirmModal>
      ) : null}
    </section>
  );
}
