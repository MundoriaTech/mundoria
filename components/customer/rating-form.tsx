"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RatingMood } from "@/types/cleaner";

const moods: Array<{
  description: string;
  emoji: string;
  label: string;
  value: RatingMood;
}> = [
  {
    description: "Everything was completed to a high standard.",
    emoji: "🤩",
    label: "Excellent",
    value: "excellent",
  },
  {
    description: "Good work with only minor issues, if any.",
    emoji: "🙂",
    label: "Good",
    value: "good",
  },
  {
    description: "Acceptable, but there is room to improve.",
    emoji: "😐",
    label: "Fair",
    value: "fair",
  },
  {
    description: "Something important was missed.",
    emoji: "🙁",
    label: "Bad",
    value: "bad",
  },
  {
    description: "The job fell far below expectations.",
    emoji: "😣",
    label: "Awful",
    value: "awful",
  },
];

export function RatingForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  cleanerId: string;
  customerId: string;
  onSubmitted: () => void;
}) {
  const [mood, setMood] = useState<RatingMood | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!mood) {
      setError("Choose the option that best describes the job.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    const response = await fetch("/api/ratings", {
      body: JSON.stringify({
        booking_id: bookingId,
        comment: comment.trim() || undefined,
        mood,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      heldForDispute?: boolean;
    };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to submit rating.");
      return;
    }

    if (result.heldForDispute) {
      setNotice(
        "Thanks — this feedback is held for 48 hours so the cleaner can dispute it if needed.",
      );
      setTimeout(onSubmitted, 1200);
      return;
    }

    onSubmitted();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">How did this clean feel?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Customers see medallions, not scores. This helps CleanScape track
          quality fairly behind the scenes.
        </p>
        <div className="mt-4 grid gap-3">
          {moods.map((option) => (
            <button
              className={cn(
                "rounded-xl border p-4 text-left transition",
                mood === option.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/50",
              )}
              key={option.value}
              onClick={() => setMood(option.value)}
              type="button"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span>
                  <b>{option.label}</b>
                  <small className="mt-0.5 block text-muted-foreground">
                    {option.description}
                  </small>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Anything else you'd like us to know? (optional)"
        value={comment}
      />
      {notice ? <p className="text-sm text-amber-700">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        className="w-full"
        disabled={submitting}
        onClick={() => void submit()}
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </Button>
    </div>
  );
}
