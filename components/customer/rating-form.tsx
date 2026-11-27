"use client";

import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import type { RatingMood } from "@/types/cleaner";

export const RATING_MOODS: Array<{
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

export function moodMeta(mood: RatingMood) {
  return RATING_MOODS.find((option) => option.value === mood) ?? null;
}

export function RatingForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  cleanerId: string;
  customerId: string;
  onSubmitted: (rating: { comment: string | null; mood: RatingMood }) => void;
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

    const trimmed = comment.trim();
    const response = await fetch("/api/ratings", {
      body: JSON.stringify({
        booking_id: bookingId,
        comment: trimmed || undefined,
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
        "Thanks, this feedback is held for 48 hours so the cleaner can dispute it if needed.",
      );
      setTimeout(() => onSubmitted({ comment: trimmed || null, mood }), 1200);
      return;
    }

    onSubmitted({ comment: trimmed || null, mood });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
          How did this clean feel?
        </p>
        <p className="m-0 mt-1 text-[13px] leading-5 text-[#5F5F66]">
          Customers see medallions, not scores. This helps Mundoria track quality fairly behind the scenes.
        </p>
        <div className="mt-4 grid gap-2">
          {RATING_MOODS.map((option) => {
            const active = mood === option.value;
            return (
              <button
                className="rounded-[14px] p-3.5 text-left transition"
                key={option.value}
                onClick={() => setMood(option.value)}
                style={{
                  border: active ? "1.5px solid #524096" : "1.5px solid #E1E1EA",
                  background: active ? "#ECE8F6" : "#F3F4F6",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span className="text-[22px] leading-none">{option.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold text-[#1E1848]">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-4 text-[#5F5F66]">
                      {option.description}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        className="min-h-24 w-full rounded-[14px] border-[1.5px] border-[#E1E1EA] bg-[#F3F4F6] p-3 text-[14px] text-[#1E1848] outline-none transition placeholder:text-[#8B8798] focus:border-[#524096] focus:bg-white"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Anything else you'd like us to know? (optional)"
        value={comment}
      />
      {notice ? <p className="m-0 text-[13.5px] text-[#8A5200]">{notice}</p> : null}
      {error ? (
        <ActionError message={error} title="Couldn't save this rating" />
      ) : null}
      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-full text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-55"
        disabled={submitting}
        onClick={() => void submit()}
        style={{ background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)" }}
        type="button"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </div>
  );
}
