"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DISPUTE_OPTIONS, type DisputeOption } from "@/lib/disputes/options";

export function GuidedDisputeForm({
  bookingId,
  onSubmitted,
  ratingId,
}: {
  bookingId: string;
  onSubmitted: () => void;
  ratingId?: string;
}) {
  const [stack, setStack] = useState<DisputeOption[][]>([DISPUTE_OPTIONS]);
  const [path, setPath] = useState<DisputeOption[]>([]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const options = stack[stack.length - 1] ?? [];
  const selected = path[path.length - 1];
  const atLeaf = selected && !selected.children?.length;
  const needsDetails = Boolean(atLeaf && selected?.requiresDetails);

  function choose(option: DisputeOption) {
    setError(null);
    setPath((current) => [...current, option]);

    if (option.children?.length) {
      setStack((current) => [...current, option.children!]);
    }
  }

  function back() {
    setError(null);
    setDetails("");
    setPath((current) => current.slice(0, -1));
    if (stack.length > 1) setStack((current) => current.slice(0, -1));
  }

  async function submit() {
    if (!selected) return;
    if (needsDetails && details.trim().length < 10) {
      setError("Please describe the issue in a little more detail.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/disputes", {
      body: JSON.stringify({
        booking_id: bookingId,
        category_path: path.map((item) => item.key),
        description: details.trim() || undefined,
        rating_id: ratingId,
        selected_option_key: selected.key,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to submit dispute.");
      return;
    }

    onSubmitted();
  }

  return (
    <div className="space-y-5">
      {path.length ? (
        <button
          className="inline-flex items-center text-sm text-muted-foreground"
          onClick={back}
          type="button"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </button>
      ) : null}

      <div>
        <p className="text-sm font-medium">
          {path.length ? "Choose the closest match" : "What do you need help with?"}
        </p>
        {path.length ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {path.map((item) => item.label).join(" → ")}
          </p>
        ) : null}
      </div>

      {!atLeaf ? (
        <div className="grid gap-2">
          {options.map((option) => (
            <button
              className="rounded-xl border p-4 text-left transition hover:border-primary"
              key={option.key}
              onClick={() => choose(option)}
              type="button"
            >
              <b>{option.label}</b>
              {option.description ? (
                <small className="mt-1 block text-muted-foreground">
                  {option.description}
                </small>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="font-medium">{selected.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              If this is not exact enough, add details below and admin will
              review it.
            </p>
          </div>
          <textarea
            className="min-h-28 w-full rounded-md border p-3 text-sm"
            onChange={(event) => setDetails(event.target.value)}
            placeholder={
              needsDetails
                ? "Tell us exactly what happened"
                : "Add more details for admin (optional)"
            }
            value={details}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Submitting…" : "Submit to admin"}
          </Button>
        </div>
      )}
    </div>
  );
}
