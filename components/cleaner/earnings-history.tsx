"use client";

import Link from "next/link";

import {
  PagedList,
  PagedTable,
} from "@/components/shared/paged-list";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
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

export function CompletedJobsHistory({ jobs }: { jobs: DoneJob[] }) {
  if (!jobs.length) {
    return (
      <p className="mt-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Completed jobs will show here with your net earnings.
      </p>
    );
  }

  return (
    <>
      <PagedList
        className="mt-4 md:hidden"
        items={jobs}
        listClassName="space-y-3"
        pageSize={PAGE_SIZES.app}
        renderItem={(job) => (
          <article
            className="rounded-xl border border-border bg-background p-4"
            key={job.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {formatServiceName(job.service_type)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {job.scheduled_date}
                </p>
              </div>
              <p className="shrink-0 font-semibold">
                {formatMoney(job.amount_cleaner)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <dt>Gross</dt>
                <dd className="text-sm text-foreground">
                  {formatMoney(job.amount_total)}
                </dd>
              </div>
              <div>
                <dt>Commission</dt>
                <dd className="text-sm text-foreground">
                  {formatMoney(
                    (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
                  )}
                </dd>
              </div>
            </dl>
            <Link
              className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-2 hover:underline"
              href={`/cleaner/job/${job.id}`}
            >
              View job
            </Link>
          </article>
        )}
      />
      <PagedTable
        className="mt-4 hidden md:block"
        headers={["Date", "Service", "Gross", "Commission", "Net", ""]}
        items={jobs}
        pageSize={PAGE_SIZES.app}
        renderRow={(job) => (
          <tr className="border-b last:border-0" key={job.id}>
            <td className="p-3">{job.scheduled_date}</td>
            <td>{formatServiceName(job.service_type)}</td>
            <td>{formatMoney(job.amount_total)}</td>
            <td>
              {formatMoney(
                (job.amount_total ?? 0) - (job.amount_cleaner ?? 0),
              )}
            </td>
            <td className="font-semibold">
              {formatMoney(job.amount_cleaner)}
            </td>
            <td className="p-3 text-right">
              <Link
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                href={`/cleaner/job/${job.id}`}
              >
                View
              </Link>
            </td>
          </tr>
        )}
        tableClassName="overflow-x-auto rounded-xl border bg-background"
      />
    </>
  );
}

export function PayoutHistoryList({ payouts }: { payouts: Payout[] }) {
  if (!payouts.length) {
    return (
      <p className="mt-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Payouts appear after completed cleans are captured and transferred.
      </p>
    );
  }

  return (
    <PagedList
      className="mt-3"
      items={payouts}
      listClassName="space-y-2"
      pageSize={PAGE_SIZES.app}
      renderItem={(payout) => (
        <div
          className="flex flex-col gap-2 rounded-xl border bg-background p-4 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"
          key={payout.id}
        >
          <div>
            <p className="font-medium">
              {payout.period_start} → {payout.period_end}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                  payout.status === "paid"
                    ? "bg-emerald-100 text-emerald-900"
                    : payout.status === "failed"
                      ? "bg-red-100 text-red-900"
                      : "bg-amber-100 text-amber-950",
                )}
              >
                {payout.status.replaceAll("_", " ")}
              </span>
            </p>
          </div>
          <p className="text-lg font-semibold">
            {formatMoney(payout.net_amount)}
          </p>
        </div>
      )}
    />
  );
}
