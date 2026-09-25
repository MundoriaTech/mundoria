"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatMoney, formatServiceName } from "@/lib/customer/services";
import type { CleanerJob } from "@/types/cleaner";

const OFFER_WINDOW_MS = 30 * 60 * 1000;

/** Compact offer card for the existing dashboard “Next session” slot. */
export function CleanerOfferHighlight({ job }: { job: CleanerJob }) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expires = new Date(job.created_at).getTime() + OFFER_WINDOW_MS;
  const remaining = Math.max(0, expires - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const area =
    job.address?.city ??
    job.address?.postcode?.split(" ")[0] ??
    "Local area";

  async function respond(response: "accepted" | "declined") {
    setBusy(true);
    const res = await fetch(`/api/cleaner/jobs/${job.id}/respond`, {
      body: JSON.stringify({ response }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusy(false);
    if (res.ok && response === "accepted") {
      router.push(`/cleaner/job/${job.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#f0c4b0] bg-white shadow-[0_16px_40px_rgba(28,19,59,0.08)]">
      <div className="bg-[#d4694a] px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
            New offer
          </p>
          <p className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {remaining > 0
              ? `${mins}:${secs.toString().padStart(2, "0")} left`
              : "Expired"}
          </p>
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">
          {formatServiceName(job.service_type)}
        </h3>
        <p className="mt-1 text-sm text-white/90">
          {job.scheduled_date} · {job.scheduled_start_time.slice(0, 5)} · {area}
        </p>
        <p className="mt-3 text-2xl font-bold tracking-tight">
          {formatMoney(job.amount_cleaner)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
        <button
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79] disabled:opacity-50 sm:flex-none"
          disabled={busy || remaining <= 0}
          onClick={() => void respond("accepted")}
          type="button"
        >
          Accept
        </button>
        <button
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea] disabled:opacity-50 sm:flex-none"
          disabled={busy || remaining <= 0}
          onClick={() => void respond("declined")}
          type="button"
        >
          Decline
        </button>
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline sm:w-auto sm:px-3"
          href="/cleaner/jobs"
        >
          All offers
        </Link>
      </div>
    </article>
  );
}
