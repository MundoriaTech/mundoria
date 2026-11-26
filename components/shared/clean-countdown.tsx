"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";

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

  const tone = timeUp
    ? "border-red-200 bg-red-50"
    : remaining <= WARNING_MS
      ? "border-amber-200 bg-amber-50"
      : "border-[#e4daf5] bg-white";

  return (
    <section className={`rounded-2xl border p-5 ${tone}`} aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6a82]">
            {timeUp ? "Booked time is up" : "Time remaining"}
          </p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-[#1c133b]">
            {timeUp ? `+${clock(-remaining)}` : clock(remaining)}
          </p>
        </div>
        <p className="text-sm text-[#5a5470]">
          Started {ukTime(startMs)} · booked until {ukTime(endMs)}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#efe9f8]">
        <div
          className={`h-full rounded-full ${timeUp ? "bg-red-500" : remaining <= WARNING_MS ? "bg-amber-500" : "bg-[#6a45b8]"}`}
          style={{ width: `${elapsedShare * 100}%` }}
        />
      </div>

      {role === "cleaner" && !timeUp && remaining <= WARNING_MS && !extensionPending ? (
        <p className="mt-3 text-sm text-amber-900">
          Less than 10 minutes left. If you won&apos;t finish, ask the customer for more
          time now.
        </p>
      ) : null}

      {role === "cleaner" && timeUp ? (
        extensionPending ? (
          <p className="mt-3 text-sm text-[#5a5470]">
            Waiting for the customer to approve more time. Wrap up unless they approve.
          </p>
        ) : !dismissed ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
            <p className="font-semibold text-[#1c133b]">Do you need more time?</p>
            <p className="mt-1 text-sm text-[#5a5470]">
              The customer sees the price and approves it in their app. You&apos;re only
              paid for time they approve.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXTENSION_OPTIONS.map((minutes) => (
                <Button
                  disabled={busy}
                  key={minutes}
                  onClick={() => void askForMore(minutes)}
                  type="button"
                  variant="outline"
                >
                  +{minutesLabel(minutes)}
                </Button>
              ))}
              <Button
                disabled={busy}
                onClick={() => setDismissed(true)}
                type="button"
                variant="ghost"
              >
                No, I&apos;m finishing up
              </Button>
            </div>
            {error ? (
              <div className="mt-3">
                <ActionError message={error} title="Couldn’t ask for more time" />
              </div>
            ) : null}
          </div>
        ) : null
      ) : null}

      {role === "customer" && timeUp ? (
        <p className="mt-3 text-sm text-[#5a5470]">
          Your booked time has finished. If your cleaner needs longer, they&apos;ll ask
          and you can approve or decline here.
        </p>
      ) : null}
    </section>
  );
}
