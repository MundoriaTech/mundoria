"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { StarRating } from "@/components/shared/star-rating";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const areas = ["Kitchen", "Bathroom", "Living Room", "Bedroom", "Other"];

export function RatingForm({
  bookingId,
  cleanerId,
  customerId,
  onSubmitted,
}: {
  bookingId: string;
  cleanerId: string;
  customerId: string;
  onSubmitted: () => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const overall = useMemo(() => {
    const values = Object.values(ratings);
    return values.length
      ? values.reduce((sum, rating) => sum + rating, 0) / values.length
      : 0;
  }, [ratings]);

  function toggleArea(area: string) {
    const key = area.toLowerCase().replaceAll(" ", "_");
    setRatings((current) => {
      const next = { ...current };
      if (key in next) delete next[key];
      else next[key] = 5;
      return next;
    });
  }

  async function submit() {
    if (!Object.keys(ratings).length) {
      setError("Select at least one area that was cleaned.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: saveError } = await createBrowserClient()
      .from("ratings")
      .insert({
        booking_id: bookingId,
        cleaner_id: cleanerId,
        comment: comment.trim() || null,
        customer_id: customerId,
        overall_score: overall,
        room_ratings: ratings,
      });
    setSubmitting(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    onSubmitted();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Which areas were cleaned?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((area) => {
            const key = area.toLowerCase().replaceAll(" ", "_");
            const selected = key in ratings;
            return (
              <button
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  selected && "border-primary bg-primary text-primary-foreground",
                )}
                key={area}
                onClick={() => toggleArea(area)}
                type="button"
              >
                {area}
                {selected ? <X className="ml-1 inline h-3 w-3" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {Object.entries(ratings).map(([area, score]) => (
        <div className="flex items-center justify-between gap-4" key={area}>
          <span className="text-sm capitalize">{area.replaceAll("_", " ")}</span>
          <StarRating
            onChange={(value) =>
              setRatings((current) => ({ ...current, [area]: value }))
            }
            value={score}
          />
        </div>
      ))}

      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-emerald-800">Overall score</p>
        <p className="text-3xl font-bold text-emerald-950">
          {overall ? overall.toFixed(1) : "—"}
        </p>
      </div>

      <textarea
        className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Anything else you'd like us to know? (optional)"
        value={comment}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        className="w-full"
        disabled={submitting}
        onClick={() => void submit()}
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </Button>
    </div>
  );
}
