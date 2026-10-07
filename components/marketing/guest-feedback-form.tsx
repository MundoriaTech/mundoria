"use client";

import {
  Smiley,
  SmileyAngry,
  SmileyMeh,
  SmileySad,
  SmileyWink,
  type IconProps,
} from "@phosphor-icons/react";
import { useState, type ComponentType, type CSSProperties } from "react";

import { GUEST_FEEDBACK_MOODS, type GuestFeedbackMood } from "@/lib/guest-feedback";
import { cn } from "@/lib/utils";

const MOOD_ICONS: Record<
  GuestFeedbackMood,
  { Icon: ComponentType<IconProps>; fill: string; line: string; tile: string }
> = {
  excellent: { Icon: Smiley, fill: "#f0a888", line: "#312c79", tile: "bg-[#fff1e8]" },
  good: { Icon: SmileyWink, fill: "#efe4ff", line: "#5b3d9e", tile: "bg-[#f6f1fc]" },
  fair: { Icon: SmileyMeh, fill: "#ffffff", line: "#5b3d9e", tile: "bg-[#f7f4ef]" },
  bad: { Icon: SmileySad, fill: "#f0a888", line: "#d4694a", tile: "bg-[#fff4ee]" },
  awful: { Icon: SmileyAngry, fill: "#f6e7df", line: "#d4694a", tile: "bg-[#f8efe9]" },
};

const ICON_STICKER =
  "[filter:drop-shadow(0_0_0.65px_#fff)_drop-shadow(0_0_0.65px_#fff)_drop-shadow(1.25px_0_0_#fff)_drop-shadow(-1.25px_0_0_#fff)_drop-shadow(0_1.25px_0_#fff)_drop-shadow(0_-1.25px_0_#fff)_drop-shadow(1px_1px_0_#fff)_drop-shadow(-1px_1px_0_#fff)_drop-shadow(1px_-1px_0_#fff)_drop-shadow(-1px_-1px_0_#fff)_drop-shadow(0_2px_3px_rgba(28,19,59,0.18))]";

export function GuestFeedbackForm() {
  const [name, setName] = useState("");
  const [mood, setMood] = useState<GuestFeedbackMood | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
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
          {name.trim() ? `Thank you, ${name.trim()}.` : "Thank you."}
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
        <span className="text-sm font-semibold text-[#1c133b]">Your name</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-[#eadfce] bg-[#fbf8f4] px-4 text-base text-[#1c133b] outline-none transition placeholder:text-[#a398b0] focus:border-[#6a45b8] focus:ring-4 focus:ring-[#6a45b8]/10"
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {GUEST_FEEDBACK_MOODS.map((option) => {
            const active = mood === option.value;
            const moodIcon = MOOD_ICONS[option.value];
            const MoodIcon = moodIcon.Icon;
            return (
              <button
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6a45b8]/15 hover:-translate-y-0.5 last:sm:col-span-2",
                  active
                    ? "border-[#312c79] bg-[#f6f1fc] ring-1 ring-[#312c79]"
                    : "border-[#eadfce] bg-[#fbf8f4] hover:border-[#6a45b8]",
                )}
                key={option.value}
                onClick={() => setMood(option.value)}
                type="button"
              >
                <span
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition duration-200",
                    moodIcon.tile,
                    active && "scale-105",
                  )}
                >
                  <MoodIcon
                    aria-hidden
                    className={cn(
                      "h-8 w-8",
                      ICON_STICKER,
                      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[var(--mood-fill)] [&_path:last-child]:!fill-[var(--mood-line)]",
                    )}
                    style={
                      {
                        "--mood-fill": moodIcon.fill,
                        "--mood-line": moodIcon.line,
                      } as CSSProperties
                    }
                    weight="duotone"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1c133b]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6 text-[#5a5470]">
                    {option.description}
                  </span>
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
