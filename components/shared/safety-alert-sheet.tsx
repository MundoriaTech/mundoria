"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import {
  SAFETY_ALERT_REASONS,
  SAFETY_REASON_LABELS,
  type SafetyAlertReason,
  safetyAlertAllowed,
} from "@/lib/bookings/safety-alert-shared";
import { FAQ_LINKS } from "@/lib/seo/faq-links";
import { cn } from "@/lib/utils";

type Step = "danger" | "details" | "confirm" | "sent";

export function SafetyAlertSheet({
  bookingId,
  onClose,
  onSubmitted,
  open,
  role,
  scheduledDate,
  status,
  supportHref = "/help",
}: {
  bookingId: string;
  onClose: () => void;
  onSubmitted?: (alertId: string) => void;
  open: boolean;
  role: "customer" | "cleaner";
  scheduledDate: string;
  status: string;
  supportHref?: string;
}) {
  const [step, setStep] = useState<Step>("danger");
  const [reason, setReason] = useState<SafetyAlertReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("danger");
      setReason(null);
      setNote("");
      setError(null);
      setPending(false);
      setAlertId(null);
      setHoldProgress(0);
      setHolding(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) window.clearInterval(holdTimer.current);
    };
  }, []);

  if (!open) return null;

  const allowed = safetyAlertAllowed(status, scheduledDate);
  const leaveCopy =
    role === "cleaner"
      ? "If you feel unsafe, leave the property. Do not argue. Call 999 if you are in immediate danger, then alert Mundoria."
      : "If you feel unsafe, leave or lock up if you can. Call 999 if you are in immediate danger, then alert Mundoria.";

  function startHold() {
    if (!reason || pending) return;
    setHolding(true);
    holdStart.current = Date.now();
    holdTimer.current = window.setInterval(() => {
      const started = holdStart.current ?? Date.now();
      const pct = Math.min(100, ((Date.now() - started) / 2000) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        if (holdTimer.current) window.clearInterval(holdTimer.current);
        holdTimer.current = null;
        setHolding(false);
        void submit();
      }
    }, 50);
  }

  function cancelHold() {
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    holdTimer.current = null;
    holdStart.current = null;
    setHolding(false);
    setHoldProgress(0);
  }

  async function submit() {
    if (!reason) return;
    setPending(true);
    setError(null);
    let clientLatitude: number | null = null;
    let clientLongitude: number | null = null;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              maximumAge: 60_000,
              timeout: 4000,
            }),
        );
        clientLatitude = position.coords.latitude;
        clientLongitude = position.coords.longitude;
      } catch {
        // Location is optional.
      }
    }

    const response = await fetch(`/api/bookings/${bookingId}/sos`, {
      body: JSON.stringify({
        clientLatitude,
        clientLongitude,
        note: note.trim() || null,
        reason,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      alertId?: string;
      error?: string;
    };
    setPending(false);
    if (!response.ok || !result.alertId) {
      setError(result.error ?? "Unable to send the alert.");
      setHoldProgress(0);
      return;
    }
    setAlertId(result.alertId);
    setStep("sent");
    onSubmitted?.(result.alertId);
  }

  async function withdraw() {
    if (!alertId) return;
    setPending(true);
    setError(null);
    const response = await fetch(
      `/api/bookings/${bookingId}/sos/${alertId}/withdraw`,
      { method: "POST" },
    );
    const result = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to withdraw the alert.");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#a67c52]">
              Safety
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#1c133b] sm:text-xl">
              {step === "sent" ? "Alert sent" : "Safety alert"}
            </h2>
          </div>
          <Button
            className="h-11 w-11 shrink-0"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!allowed ? (
          <p className="text-sm leading-6 text-[#5a5470]">
            Safety alerts are available on the day of your visit and while the
            session is live.
          </p>
        ) : null}

        {allowed && step === "danger" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#5a5470]">{leaveCopy}</p>
            <p className="rounded-xl bg-[#fff1ea] px-4 py-3 text-sm leading-6 text-[#7a3b28]">
              Mundoria cannot replace emergency services. If you or someone else
              is in immediate danger, call 999 first.
            </p>
            <Button asChild className="h-12 w-full rounded-full bg-[#9f1239] hover:bg-[#881337]">
              <a href="tel:999">Call 999</a>
            </Button>
            <Button
              className="h-12 w-full rounded-full"
              onClick={() => setStep("details")}
              type="button"
              variant="outline"
            >
              Also alert Mundoria
            </Button>
            <p className="text-xs leading-5 text-[#8b8798]">
              For cleaning quality, lateness or breakage, use Report issue
              instead — not a safety alert.
            </p>
          </div>
        ) : null}

        {allowed && step === "details" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#5a5470]">
              Choose what best describes the situation. Your private note is
              only shared with Mundoria.
            </p>
            <div className="grid gap-2">
              {SAFETY_ALERT_REASONS.map((value) => (
                <button
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                    reason === value
                      ? "border-[#9f1239] bg-[#fff1f2] text-[#9f1239]"
                      : "border-[#e6e0f2] bg-white text-[#1c133b] hover:bg-[#faf8fc]",
                  )}
                  key={value}
                  onClick={() => setReason(value)}
                  type="button"
                >
                  {SAFETY_REASON_LABELS[value]}
                </button>
              ))}
            </div>
            <label className="block space-y-2 text-sm font-medium">
              <span>Optional note</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-[#d9ccef] bg-white px-4 py-3 text-sm outline-none ring-[#6a45b8] focus:ring-2"
                maxLength={280}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Anything Mundoria should know right now"
                value={note}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                disabled={!reason}
                onClick={() => setStep("confirm")}
                type="button"
              >
                Continue
              </Button>
              <Button
                className="rounded-full"
                onClick={() => setStep("danger")}
                type="button"
                variant="ghost"
              >
                Back
              </Button>
            </div>
          </div>
        ) : null}

        {allowed && step === "confirm" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#5a5470]">
              Mundoria ops will be paged. This booking will be paused for
              review. The other party is told an alert was raised — not your
              private note.
            </p>
            <FormStatus message={error} title="Couldn’t send the alert" />
            <button
              className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-[#9f1239] text-sm font-semibold text-white disabled:opacity-60"
              disabled={pending || !reason}
              onMouseDown={startHold}
              onMouseLeave={cancelHold}
              onMouseUp={cancelHold}
              onTouchEnd={cancelHold}
              onTouchStart={startHold}
              type="button"
            >
              <span
                className="absolute inset-y-0 left-0 bg-black/20 transition-[width]"
                style={{ width: `${holdProgress}%` }}
              />
              <span className="relative">
                {pending
                  ? "Sending…"
                  : holding
                    ? "Keep holding…"
                    : "Hold to send safety alert"}
              </span>
            </button>
            <Button
              className="w-full rounded-full"
              onClick={() => setStep("details")}
              type="button"
              variant="ghost"
            >
              Back
            </Button>
          </div>
        ) : null}

        {step === "sent" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#5a5470]">
              Stay somewhere you feel safe. Mundoria has been notified
              {alertId ? (
                <>
                  {" "}
                  (case{" "}
                  <span className="font-mono font-semibold">
                    {alertId.slice(0, 8)}
                  </span>
                  )
                </>
              ) : null}
              . A team member will respond. If you are still in danger, call
              999.
            </p>
            <FormStatus message={error} title="Update" />
            <div className="grid gap-2">
              <Button asChild className="h-12 rounded-full bg-[#9f1239] hover:bg-[#881337]">
                <a href="tel:999">Call 999</a>
              </Button>
              <Button asChild className="h-12 rounded-full" variant="outline">
                <Link href={supportHref}>Message Mundoria support</Link>
              </Button>
              <Button
                className="h-12 rounded-full"
                onClick={onClose}
                type="button"
                variant="outline"
              >
                View booking status
              </Button>
              {alertId ? (
                <button
                  className="text-sm font-semibold text-[#5a5470] underline-offset-2 hover:underline"
                  disabled={pending}
                  onClick={() => void withdraw()}
                  type="button"
                >
                  I raised this by mistake
                </button>
              ) : null}
            </div>
            <p className="text-xs leading-5 text-[#8b8798]">
              Withdrawing notifies ops but does not clear the booking hold
              without Mundoria.{" "}
              <Link
                className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                href={FAQ_LINKS.safetyAlert}
              >
                How safety alerts work
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
