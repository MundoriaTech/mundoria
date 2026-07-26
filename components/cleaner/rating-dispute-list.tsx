"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { GuidedDisputeForm } from "@/components/shared/guided-dispute-form";
import { Button } from "@/components/ui/button";

interface HeldRating {
  id: string;
  booking_id: string;
  dispute_deadline: string | null;
  mood: string | null;
}

export function RatingDisputeList({ ratings }: { ratings: HeldRating[] }) {
  const [selected, setSelected] = useState<HeldRating | null>(null);

  if (!ratings.length) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-amber-950">Ratings open for dispute</h2>
      <p className="mt-1 text-sm text-amber-900/80">
        Bad or awful feedback is held for 48 hours before it affects your
        medallion score. Dispute anything you believe is unfair.
      </p>
      <div className="mt-4 space-y-2">
        {ratings.map((rating) => (
          <div
            className="flex items-center justify-between rounded-lg bg-background p-3 text-sm"
            key={rating.id}
          >
            <span>
              <b className="capitalize">{rating.mood?.replace("_", " ")}</b>
              <small className="ml-2 text-muted-foreground">
                Deadline:{" "}
                {rating.dispute_deadline
                  ? new Date(rating.dispute_deadline).toLocaleString("en-GB")
                  : "—"}
              </small>
            </span>
            <Button onClick={() => setSelected(rating)} size="sm" variant="outline">
              Dispute
            </Button>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dispute rating</h2>
              <Button onClick={() => setSelected(null)} size="icon" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <GuidedDisputeForm
              bookingId={selected.booking_id}
              ratingId={selected.id}
              onSubmitted={() => setSelected(null)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
