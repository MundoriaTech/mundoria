"use client";

import { useState } from "react";

import { GUEST_FEEDBACK_MOODS, type GuestFeedbackMood } from "@/lib/guest-feedback";
import { cn } from "@/lib/utils";

export function GuestFeedbackForm() {
  const [name, setName] = useState("");
  const [mood, setMood] = useState<GuestFeedbackMood | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) {
      setError("Add your name.");
      return;
    }
    if (!mood) {
      setError("Choose the option that best describes the clean.");
      return;
    }
    if (comment.trim().length < 2) {
      setError("Write a short review.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/guest-feedback", {
      body: JSON.stringify({
        comment: comment.trim(),
        mood,
        name: name.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "We couldn’t send that. Please try again.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[#eadfce] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1c133b]">
          Thank you, {name.trim()}.
        </h2>
        <p className="mt-3 text-base leading-7 text-[#5a5470]">
          We’ve received your review. It stays with the Mundoria team.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-[#eadfce] bg-white p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block text-sm font-semibold text-[#1c133b]" htmlFor="reviewer-name">
        Your name
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-[#eadfce] bg-[#f7f2ea] px-4 text-base font-normal text-[#1c133b] outline-none focus:border-[#6a45b8]"
          id="reviewer-name"
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-[#1c133b]">
          How did the clean feel?
        </legend>
        <div className="mt-4 grid gap-3">
          {GUEST_FEEDBACK_MOODS.map((option) => (
            <button
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                mood === option.value
                  ? "border-[#6a45b8] bg-[#f6f1fc] ring-1 ring-[#6a45b8]"
                  : "border-[#eadfce] hover:border-[#6a45b8]/50",
              )}
              key={option.value}
              onClick={() => setMood(option.value)}
              type="button"
            >
              <span className="block font-semibold text-[#1c133b]">
                {option.label}
              </span>
              <span className="mt-1 block text-sm text-[#5a5470]">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block text-sm font-semibold text-[#1c133b]" htmlFor="feedback">
        Your review
        <textarea
          className="mt-2 min-h-36 w-full rounded-2xl border border-[#eadfce] bg-[#f7f2ea] px-4 py-3 text-base font-normal text-[#1c133b] outline-none focus:border-[#6a45b8]"
          id="feedback"
          maxLength={2000}
          onChange={(event) => setComment(event.target.value)}
          value={comment}
        />
      </label>

      {error ? <p className="mt-4 text-sm text-[#9a3412]">{error}</p> : null}

      <button
        className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3] disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
