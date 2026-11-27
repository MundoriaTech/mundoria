"use client";

import { X } from "lucide-react";
import { useState } from "react";

import {
  pillOutline,
  SectionHeading,
} from "@/components/customer/dashboard/section-banner";
import { GuidedDisputeForm } from "@/components/shared/guided-dispute-form";
import { cn } from "@/lib/utils";

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
    <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
      <SectionHeading title="Ratings open for dispute" />
      <p className="m-0 text-[14px] leading-5 text-[#5F5F66]">
        Bad or awful feedback is held for 48 hours before it affects your
        medallion score. Dispute anything you believe is unfair.
      </p>
      <div className="flex flex-col gap-1.5">
        {ratings.map((rating) => (
          <div
            className="flex flex-col gap-3 rounded-[18px] bg-[#FFF5E6] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            key={rating.id}
          >
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-semibold capitalize text-[#8A5200]">
                {rating.mood?.replaceAll("_", " ")}
              </p>
              <p className="m-0 mt-0.5 text-[13px] text-[#8A5200]/80">
                Deadline:{" "}
                {rating.dispute_deadline
                  ? new Date(rating.dispute_deadline).toLocaleString("en-GB")
                  : "-"}
              </p>
            </div>
            <button
              className={cn(
                pillOutline,
                "min-h-9 border-[#E2C08A] px-4 text-[13px] text-[#8A5200] hover:bg-[#FFF9F0] xl:min-h-9 xl:px-4 xl:text-[13px]",
              )}
              onClick={() => setSelected(rating)}
              type="button"
            >
              Dispute
            </button>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1848]/55 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-5 shadow-[0_24px_60px_rgba(30,24,72,0.28)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#1E1848]">
                Dispute rating
              </h2>
              <button
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6B6B70] transition hover:bg-[#F3F4F6] hover:text-[#1E1848]"
                onClick={() => setSelected(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <GuidedDisputeForm
              bookingId={selected.booking_id}
              onSubmitted={() => setSelected(null)}
              ratingId={selected.id}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
