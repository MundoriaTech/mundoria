"use client";

import Link from "next/link";

import {
  PagedList,
  PagedTable,
} from "@/components/shared/paged-list";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { Payout } from "@/types/cleaner";
import type { ServiceType } from "@/types/customer";

type DoneJob = {
  amount_cleaner: number | null;
  amount_total: number | null;
  id: string;
  scheduled_date: string;
  service_type: ServiceType;
};

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAYOUT_PILL: Record<string, { bg: string; color: string }> = {
  failed: { bg: "#FEE9E9", color: "#C0272D" },
  paid: { bg: "#E0F4EB", color: "#1A7A4A" },
  pending: { bg: "#FFF5E6", color: "#C17E24" },
};

export function CompletedJobsHistory({ jobs }: { jobs: DoneJob[] }) {
  if (!jobs.length) {
    return (
      <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-12 text-center">
        <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
          No completed jobs yet
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#6B6B70]">
          Completed jobs will show here with your net earnings.
        </p>
      </div>
    );
  }

  return (
    <>
      <PagedList
        className="md:hidden"
        items={jobs}
        listClassName="flex flex-col gap-1.5"
        pageSize={PAGE_SIZES.app}
        renderItem={(job) => (
          <article
            className="rounded-[18px] bg-[#F3F4F6] p-4"
            key={job.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 truncate text-[15px] font-semibold text-[#1E1848]">
                  {bookingServiceName(job)}
                </p>
                <p className="m-0 mt-0.5 text-[13px] text-[#6B6B70]">
                  {formatDay(job.scheduled_date)}
                </p>
              </div>
              <p className="m-0 shrink-0 text-[16px] font-semibold text-[#523F97]">
                {formatMoney(job.amount_cleaner)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[12px] bg-white px-3 py-2">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B8798]">
                  Gross
                </dt>
                <dd className="m-0 mt-0.5 text-[14px] font-semibold text-[#1E1848]">
                  {formatMoney(job.amount_total)}
                </dd>
              </div>
              <div className="rounded-[12px] bg-white px-3 py-2">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B8798]">
                  Commission
                </dt>
                <dd className="m-0 mt-0.5 text-[14px] font-semibold text-[#1E1848]">
                  {formatMoney(
                    (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
                  )}
                </dd>
              </div>
            </dl>
            <Link
              className="mt-3 inline-flex text-[13px] font-semibold text-[#524096] no-underline underline-offset-2 hover:underline"
              href={`/cleaner/job/${job.id}`}
            >
              View job
            </Link>
          </article>
        )}
      />
      <PagedTable
        className="hidden md:block"
        headers={["Date", "Service", "Gross", "Commission", "Net", ""]}
        items={jobs}
        pageSize={PAGE_SIZES.app}
        renderRow={(job) => (
          <tr
            className="border-b border-[#E7E7EF] last:border-0"
            key={job.id}
          >
            <td className="p-3.5 text-[14px] text-[#5F5F66]">
              {formatDay(job.scheduled_date)}
            </td>
            <td className="p-3.5 text-[14px] font-semibold text-[#1E1848]">
              {bookingServiceName(job)}
            </td>
            <td className="p-3.5 text-[14px] text-[#5F5F66]">
              {formatMoney(job.amount_total)}
            </td>
            <td className="p-3.5 text-[14px] text-[#5F5F66]">
              {formatMoney(
                (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
              )}
            </td>
            <td className="p-3.5 text-[14px] font-semibold text-[#523F97]">
              {formatMoney(job.amount_cleaner)}
            </td>
            <td className="p-3.5 text-right">
              <Link
                className="text-[13px] font-semibold text-[#524096] no-underline underline-offset-2 hover:underline"
                href={`/cleaner/job/${job.id}`}
              >
                View
              </Link>
            </td>
          </tr>
        )}
        tableClassName="overflow-x-auto rounded-[18px] bg-[#F3F4F6]"
      />
    </>
  );
}

export function PayoutHistoryList({ payouts }: { payouts: Payout[] }) {
  if (!payouts.length) {
    return (
      <div className="rounded-[18px] bg-[#F3F4F6] px-5 py-12 text-center">
        <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
          No payouts yet
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#6B6B70]">
          Payouts appear after completed cleans are captured and transferred.
        </p>
      </div>
    );
  }

  return (
    <PagedList
      items={payouts}
      listClassName="flex flex-col gap-1.5"
      pageSize={PAGE_SIZES.app}
      renderItem={(payout) => {
        const tone =
          PAYOUT_PILL[payout.status] ?? PAYOUT_PILL.pending!;
        return (
          <div
            className="flex flex-col gap-2 rounded-[18px] bg-[#F3F4F6] p-4 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"
            key={payout.id}
          >
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-semibold text-[#1E1848]">
                {formatDay(payout.period_start)} → {formatDay(payout.period_end)}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize",
                )}
                style={{ background: tone.bg, color: tone.color }}
              >
                {payout.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#523F97]">
              {formatMoney(payout.net_amount)}
            </p>
          </div>
        );
      }}
    />
  );
}
