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
      <div className="rounded-[28px] border border-white/80 bg-white px-6 py-10 shadow-[0_20px_50px_-28px_rgba(49,44,121,0.45)] sm:px-8">
        <h2 className="text-3xl font-black tracking-[-0.04em] text-[#1c133b]">
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
      className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_50px_-28px_rgba(49,44,121,0.45)] sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block" htmlFor="reviewer-name">
        <span className="text-sm font-semibold text-[#1c133b]">
          Your name
          <span className="text-[#d14343]"> *</span>
        </span>
        <input
          aria-required="true"
          className="mt-2 h-12 w-full rounded-2xl border border-[#eadfce] bg-[#fbf8f4] px-4 text-base text-[#1c133b] outline-none transition placeholder:text-[#a398b0] focus:border-[#6a45b8] focus:ring-4 focus:ring-[#6a45b8]/10"
          id="reviewer-name"
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-[#1c133b]">
          How did the clean feel?
        </legend>
        <div className="mt-3 grid gap-2">
          {GUEST_FEEDBACK_MOODS.map((option) => {
            const active = mood === option.value;
            return (
              <button
                aria-pressed={active}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6a45b8]/15",
                  active
                    ? "border-[#312c79] bg-[#f6f1fc] ring-1 ring-[#312c79]"
                    : "border-[#eadfce] bg-[#fbf8f4] hover:border-[#6a45b8]",
                )}
                key={option.value}
                onClick={() => setMood(option.value)}
                type="button"
              >
                <span className="block text-sm font-semibold text-[#1c133b]">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-sm leading-6 text-[#5a5470]">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-2 block" htmlFor="feedback">
        <span className="text-sm font-semibold text-[#1c133b]">
          Your review
          <span className="text-[#d14343]"> *</span>
        </span>
        <textarea
          aria-required="true"
          className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-[#eadfce] bg-[#fbf8f4] px-4 py-3 text-base leading-7 text-[#1c133b] outline-none transition placeholder:text-[#a398b0] focus:border-[#6a45b8] focus:ring-4 focus:ring-[#6a45b8]/10"
          id="feedback"
          maxLength={2000}
          onChange={(event) => setComment(event.target.value)}
          required
          value={comment}
        />
      </label>

      {error ? (
        <p className="mt-4 text-sm font-medium text-[#9a3412]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6a45b8]/25 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
