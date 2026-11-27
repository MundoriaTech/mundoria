"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pillPrimaryStyle } from "@/components/customer/dashboard/section-banner";
import type { CleanerJob } from "@/types/cleaner";

const OFFER_WINDOW_MS = 30 * 60 * 1000;

/** Accept / decline row for an open offer on the cleaner dashboard. */
export function CleanerOfferActions({ job }: { job: CleanerJob }) {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0 text-[15px] font-semibold tabular-nums text-[#524096]">
        {closed
          ? "Offer closed"
          : `Respond in ${mins}:${secs.toString().padStart(2, "0")}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          disabled={busy || closed}
          onClick={() => void respond("accepted")}
          style={pillPrimaryStyle}
          type="button"
        >
          Accept
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-full border-2 border-[#524096] bg-white px-5 text-[14px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6] disabled:opacity-50"
          disabled={busy || closed}
          onClick={() => void respond("declined")}
          type="button"
        >
          Decline
        </button>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full px-3 text-[14px] font-semibold text-[#524096] no-underline transition hover:underline"
          href={`/cleaner/job/${job.id}`}
        >
          Details
        </Link>
      </div>
    </div>
  );
}

/** @deprecated Prefer CleanerOfferActions with shared dashboard tiles. */
export function CleanerOfferHighlight({ job }: { job: CleanerJob }) {
  return <CleanerOfferActions job={job} />;
}
