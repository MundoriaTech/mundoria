"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatMoney, formatServiceName } from "@/lib/customer/services";
import type { CleanerJob } from "@/types/cleaner";

const OFFER_WINDOW_MS = 30 * 60 * 1000;

/** Offer waiting on the cleaner dashboard. */
export function CleanerOfferHighlight({ job }: { job: CleanerJob }) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expires = job.offer_expires_at
    ? new Date(job.offer_expires_at).getTime()
    : new Date(job.created_at).getTime() + OFFER_WINDOW_MS;
  const remaining = Math.max(0, expires - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const area =
    job.address?.city ??
    job.address?.postcode?.split(" ")[0] ??
    "Nearby";
  const when = new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString(
    "en-GB",
    { weekday: "short", day: "numeric", month: "short" },
  );
  const time = job.scheduled_start_time.slice(0, 5);
  const hours = job.estimated_duration_hours;
  const closed = remaining <= 0;

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
    <article className="overflow-hidden rounded-[1.75rem] border border-brand-line bg-white shadow-[0_16px_40px_rgba(28,19,59,0.06)]">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-gold">
            Waiting for you
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-ink">
            {formatServiceName(job.service_type)}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#5c5670]">
            {when} at {time}, in {area}.
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-[#fff4ee] px-3 py-1.5 text-sm font-semibold tabular-nums text-[#7a3b28]">
          {closed ? "Closed" : `${mins}:${secs.toString().padStart(2, "0")}`}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px border-y border-brand-lavender-light bg-brand-lavender-light sm:grid-cols-3">
        <Fact label="When" value={`${when} · ${time}`} />
        <Fact label="Area" value={area} />
        <Fact
          label="Your pay"
          value={job.amount_cleaner ? formatMoney(job.amount_cleaner) : "—"}
        />
      </dl>

      {hours ? (
        <p className="px-5 pt-4 text-sm text-[#5c5670] sm:px-6">
          About {hours} hour{hours === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-ink px-5 text-sm font-semibold text-white transition hover:bg-brand-indigo disabled:opacity-50"
          disabled={busy || closed}
          onClick={() => void respond("accepted")}
          type="button"
        >
          Accept
        </button>
        <button
          className="inline-flex h-11 items-center justify-center rounded-full border border-brand-line bg-white px-5 text-sm font-semibold text-brand-ink transition hover:bg-[#f7f2ea] disabled:opacity-50"
          disabled={busy || closed}
          onClick={() => void respond("declined")}
          type="button"
        >
          Decline
        </button>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-brand-indigo"
          href={`/cleaner/job/${job.id}`}
        >
          See details
        </Link>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-3.5 sm:px-6">
      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-brand-violet">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tracking-tight text-brand-ink">
        {value}
      </dd>
    </div>
  );
}
