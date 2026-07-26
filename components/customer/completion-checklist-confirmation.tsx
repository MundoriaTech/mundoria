"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BookingChecklistItem } from "@/types/customer";

export function CompletionChecklistConfirmation({
  bookingId,
  items,
  onConfirmed,
}: {
  bookingId: string;
  items: BookingChecklistItem[];
  onConfirmed: () => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.item_key, true])),
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const unchecked = useMemo(
    () => items.filter((item) => checked[item.item_key] === false),
    [checked, items],
  );

  async function submit() {
    const missingReason = unchecked.find(
      (item) => !reasons[item.item_key]?.trim(),
    );

    if (missingReason) {
      setError(`Add a reason for "${missingReason.label}".`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}/confirm-completion`, {
      body: JSON.stringify({
        unchecked_items: unchecked.map((item) => ({
          item_key: item.item_key,
          label: item.label,
          reason: reasons[item.item_key].trim(),
        })),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to confirm completion.");
      return;
    }

    onConfirmed();
  }

  return (
    <section className="rounded-xl border bg-background p-5">
      <h2 className="text-lg font-semibold">Confirm completed checklist</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything is checked by default. Untick only the items that were not
        completed and tell us why.
      </p>
      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const isChecked = checked[item.item_key] !== false;

          return (
            <div className="rounded-lg border p-4" key={item.id}>
              <label className="flex items-start gap-3">
                <input
                  checked={isChecked}
                  className="mt-1"
                  onChange={(event) =>
                    setChecked((current) => ({
                      ...current,
                      [item.item_key]: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>
                  <b>{item.label}</b>
                  {item.description ? (
                    <small className="mt-1 block text-muted-foreground">
                      {item.description}
                    </small>
                  ) : null}
                </span>
              </label>
              {!isChecked ? (
                <textarea
                  className="mt-3 min-h-20 w-full rounded-md border p-3 text-sm"
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [item.item_key]: event.target.value,
                    }))
                  }
                  placeholder="Why was this not completed?"
                  value={reasons[item.item_key] ?? ""}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <Button
        className="mt-5 w-full"
        disabled={submitting || !items.length}
        onClick={() => void submit()}
      >
        {submitting ? "Confirming…" : "Confirm checklist"}
      </Button>
    </section>
  );
}
