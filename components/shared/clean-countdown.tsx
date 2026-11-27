"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActionError } from "@/components/shared/action-error";

const EXTENSION_OPTIONS = [30, 60, 90] as const;
const WARNING_MS = 10 * 60 * 1000;

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function minutesLabel(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes} min`;
}

function ukTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

/**
 * Live countdown of the booked time once a clean has started. Approved extra
 * time is already added to the booking's hours, so the end moves with it.
 * When time runs out the cleaner is asked whether they need an extension.
 */
export function CleanCountdown({
  bookingId,
  durationHours,
  extensionPending = false,
  role,
  startedAt,
}: {
  bookingId: string;
  durationHours: number | null;
  extensionPending?: boolean;
  role: "cleaner" | "customer";
  startedAt: string | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startMs = startedAt ? new Date(startedAt).getTime() : NaN;
  const totalMs = Math.max(0, Number(durationHours ?? 0)) * 60 * 60 * 1000;
  const endMs = startMs + totalMs;
  const remaining = endMs - now;
  const timeUp = remaining <= 0;

  // While an extension waits for the customer, pick up their answer.
  useEffect(() => {
    if (!extensionPending) return;
    const timer = window.setInterval(() => router.refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [extensionPending, router]);

  if (!startedAt || Number.isNaN(startMs) || totalMs <= 0) return null;

  const elapsedShare = Math.min(1, Math.max(0, (now - startMs) / totalMs));

  async function askForMore(minutes: number) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/cleaner/jobs/${bookingId}/extra-time`, {
      body: JSON.stringify({ minutes, reason: "Booked time ran out" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Couldn't send the request. Try again.");
      return;
    }
    router.refresh();
  }

  const warning = !timeUp && remaining <= WARNING_MS;
  // Ring colours follow the dashboard: purple running, amber near the end, red over.
  const ringColour = timeUp ? "#E8452C" : warning ? "#F0A93B" : "#8B7FC0";
  const labelColour = timeUp ? "#FF9A85" : warning ? "#F6C66F" : "#C69C66";
  const R = 62;
  const C = 2 * Math.PI * R;
  // The ring empties as time runs down; when time is up it is full red.
  const shown = timeUp ? 1 : 1 - elapsedShare;

  return (
    <section
      className="relative overflow-hidden rounded-[18px] p-5 text-white"
      style={{ background: "#1E1848" }}
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern height="22" id="countdown-dots" patternUnits="userSpaceOnUse" width="22">
            <circle cx="1.5" cy="1.5" fill="rgba(255,255,255,0.07)" r="1.5" />
          </pattern>
        </defs>
        <rect fill="url(#countdown-dots)" height="100%" width="100%" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: "220px", height: "220px", left: "-50px", top: "-70px", background: "radial-gradient(circle,rgba(130,113,177,0.35) 0%,transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <div className="relative h-[150px] w-[150px] shrink-0">
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 150 150">
            <circle cx="75" cy="75" fill="none" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
            <circle
              cx="75"
              cy="75"
              fill="none"
              r={R}
              stroke={ringColour}
              strokeDasharray={`${Math.max(0.001, shown) * C} ${C}`}
              strokeLinecap="round"
              strokeWidth="12"
              style={{ transition: "stroke-dasharray 1s linear, stroke 0.4s" }}
              transform="rotate(-90 75 75)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" role="timer">
            <span className="font-semibold tabular-nums tracking-[-0.02em]" style={{ fontSize: "28px", lineHeight: 1 }}>
              {timeUp ? `+${clock(-remaining)}` : clock(remaining)}
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
              {timeUp ? "over" : "left"}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p aria-live="polite" className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: labelColour }}>
            {timeUp ? "Booked time is up" : warning ? "Nearly finished" : "Cleaning now"}
          </p>
          <p className="m-0 mt-2 text-[17px] font-semibold leading-snug">
            Started {ukTime(startMs)} · booked until {ukTime(endMs)}
          </p>
          {role === "cleaner" && warning && !extensionPending ? (
            <p className="m-0 mt-2 text-[14px] leading-[1.45] text-white/75">
              Less than 10 minutes left. If you won&apos;t finish, ask for more time now.
            </p>
          ) : null}
          {role === "customer" && timeUp ? (
            <p className="m-0 mt-2 text-[14px] leading-[1.45] text-white/75">
              Your booked time has finished. If your cleaner needs longer, they&apos;ll ask and you can approve or decline here.
            </p>
          ) : null}
          {role === "customer" && !timeUp ? (
            <p className="m-0 mt-2 text-[14px] leading-[1.45] text-white/75">
              Any extra time you approve is added here.
            </p>
          ) : null}
          {role === "cleaner" && timeUp && extensionPending ? (
            <p className="m-0 mt-2 text-[14px] leading-[1.45] text-white/75">
              Waiting for the customer to approve more time. Wrap up unless they approve.
            </p>
          ) : null}
        </div>
      </div>

      {role === "cleaner" && timeUp && !extensionPending && !dismissed ? (
        <div className="relative mt-5 rounded-[14px] bg-white/10 p-4">
          <p className="m-0 text-[16px] font-semibold">Do you need more time?</p>
          <p className="m-0 mt-1 text-[13.5px] leading-[1.45] text-white/75">
            The customer sees the price and approves it in their app. You&apos;re only paid for time they approve.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXTENSION_OPTIONS.map((minutes) => (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-[14px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6] disabled:opacity-60"
                disabled={busy}
                key={minutes}
                onClick={() => void askForMore(minutes)}
                type="button"
              >
                +{minutesLabel(minutes)}
              </button>
            ))}
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-4 text-[14px] font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              disabled={busy}
              onClick={() => setDismissed(true)}
              type="button"
            >
              No, I&apos;m finishing up
            </button>
          </div>
          {error ? (
            <div className="mt-3">
              <ActionError message={error} title="Couldn’t ask for more time" />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
