"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExtraTimeRow } from "@/lib/bookings/extra-time";

const OPTIONS = [30, 60, 90] as const;

function label(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes} min`;
}

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

const STATUS: Record<ExtraTimeRow["status"], string> = {
  approved: "Approved, charged after the clean",
  cancelled: "Cancelled",
  charged: "Approved and charged",
  declined: "Declined",
  failed: "Approved, charge failed",
  pending: "Waiting for the customer",
};

function History({ rows }: { rows: ExtraTimeRow[] }) {
  if (!rows.length) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {rows.map((row) => (
        <li className="flex flex-wrap justify-between gap-2" key={row.id}>
          <span>
            +{label(row.minutes)} · {money(row.amount_pence)}
          </span>
          <span className="text-muted-foreground">{STATUS[row.status]}</span>
        </li>
      ))}
    </ul>
  );
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  return response.ok ? null : (result.error ?? "Something went wrong. Try again.");
}

/** Cleaner: ask the customer for more time while the clean is in progress. */
export function CleanerExtraTime({
  bookingId,
  inProgress,
  rows,
}: {
  bookingId: string;
  inProgress: boolean;
  rows: ExtraTimeRow[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = rows.some((row) => row.status === "pending");
  if (!inProgress && !rows.length) return null;

  async function ask(minutes: number) {
    setBusy(true);
    setError(null);
    const failure = await post(`/api/cleaner/jobs/${bookingId}/extra-time`, { minutes, reason });
    setBusy(false);
    if (failure) setError(failure);
    else {
      setReason("");
      router.refresh();
    }
  }

  return (
    <section className="rounded-2xl border border-[#e8e0d0] bg-white p-4">
      <h3 className="font-semibold text-[#1c133b]">Need more time?</h3>
      {inProgress && !pending ? (
        <>
          <p className="mt-1 text-sm text-[#5a5470]">
            Ask the customer before you carry on. They see the price and approve it in their app.
            You&apos;re only paid for time they approve.
          </p>
          <Input
            className="mt-3"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why, e.g. the oven needs a deep clean (optional)"
            value={reason}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {OPTIONS.map((minutes) => (
              <Button disabled={busy} key={minutes} onClick={() => void ask(minutes)} type="button" variant="outline">
                +{label(minutes)}
              </Button>
            ))}
          </div>
        </>
      ) : pending ? (
        <p className="mt-1 text-sm text-[#5a5470]">
          Waiting for the customer to answer. Finish the booked time unless they approve.
        </p>
      ) : null}
      {error ? <div className="mt-3"><ActionError message={error} title="Couldn’t send the request" /></div> : null}
      <History rows={rows} />
    </section>
  );
}

/** Customer: approve or decline the cleaner's request. */
export function CustomerExtraTime({ bookingId, rows }: { bookingId: string; rows: ExtraTimeRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = rows.find((row) => row.status === "pending");
  if (!rows.length) return null;

  async function decide(decision: "approved" | "declined") {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const failure = await post(`/api/bookings/${bookingId}/extra-time`, {
      decision,
      extensionId: pending.id,
    });
    setBusy(false);
    if (failure) setError(failure);
    else router.refresh();
  }

  return (
    <section className="rounded-[18px] border border-[#e6e8ee] bg-white p-5">
      {pending ? (
        <>
          <h2 className="text-lg font-semibold text-[#1c133b]">Your cleaner asked for more time</h2>
          <p className="mt-1 text-sm leading-6 text-[#5c6570]">
            +{label(pending.minutes)} for {money(pending.amount_pence)}
            {pending.reason ? `. “${pending.reason}”` : ""}. It&apos;s charged with your visit,
            the day after the clean. If you decline, they&apos;ll finish within the booked time.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void decide("approved")} type="button">
              Approve {money(pending.amount_pence)}
            </Button>
            <Button disabled={busy} onClick={() => void decide("declined")} type="button" variant="outline">
              Decline
            </Button>
          </div>
        </>
      ) : (
        <h2 className="text-base font-semibold text-[#1c133b]">Extra time</h2>
      )}
      {error ? <div className="mt-3"><ActionError message={error} title="Couldn’t save that" /></div> : null}
      <History rows={rows.filter((row) => row.id !== pending?.id)} />
    </section>
  );
}

/** Admin: see requests and record time the customer agreed to. */
export function AdminExtraTime({ bookingId, rows }: { bookingId: string; rows: ExtraTimeRow[] }) {
  const router = useRouter();
  const [minutes, setMinutes] = useState("30");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const failure = await post(`/api/admin/bookings/${bookingId}/extra-time`, {
      minutes: Number(minutes),
      note,
    });
    setBusy(false);
    if (failure) setError(failure);
    else {
      setNote("");
      router.refresh();
    }
  }

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Extra time</h2>
      {rows.length ? <History rows={rows} /> : (
        <p className="mt-1 text-sm text-muted-foreground">No extra time on this visit.</p>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => setMinutes(event.target.value)}
          value={minutes}
        >
          {[15, 30, 45, 60, 90, 120].map((value) => (
            <option key={value} value={value}>
              +{label(value)}
            </option>
          ))}
        </select>
        <Input
          onChange={(event) => setNote(event.target.value)}
          placeholder="How the customer agreed, e.g. by phone at 11:20"
          value={note}
        />
        <Button disabled={busy || note.trim().length < 3} onClick={() => void add()} type="button">
          Add agreed time
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Priced at this booking&apos;s hourly rate (plus supplies if booked) and charged after the
        visit. The cleaner is paid it, minus commission.
      </p>
      {error ? <div className="mt-3"><ActionError message={error} title="Couldn’t add the time" /></div> : null}
    </section>
  );
}
