"use client";

import {
  PagedList,
  PagedTable,
} from "@/components/shared/paged-list";
import { formatMoney } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";

export type AdminPayoutRow = {
  cleaner: { full_name: string | null } | null;
  created_at: string;
  gross_amount: number;
  id: string;
  net_amount: number;
  period_end: string;
  period_start: string;
  status: string;
  stripe_transfer_id: string | null;
  total_jobs: number;
};

export function PayoutsTable({ payouts }: { payouts: AdminPayoutRow[] }) {
  return (
    <>
      <PagedList
        className="mt-6 md:hidden"
        empty={
          <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No payouts yet.
          </p>
        }
        items={payouts}
        listClassName="space-y-3"
        pageSize={PAGE_SIZES.admin}
        renderItem={(item) => (
          <div
            className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-4 shadow-[0_8px_20px_rgba(49,44,121,0.04)]"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {item.cleaner?.full_name ?? "Cleaner"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.period_start}, {item.period_end}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs capitalize">
                {item.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{item.total_jobs} jobs</span>
              <span className="font-semibold">
                {formatMoney(item.net_amount)}
              </span>
            </div>
            {item.stripe_transfer_id ? (
              <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                {item.stripe_transfer_id}
              </p>
            ) : null}
          </div>
        )}
      />

      <PagedTable
        className="mt-6 hidden md:block"
        empty="No payouts yet."
        headers={[
          "Cleaner",
          "Period",
          "Jobs",
          "Gross",
          "Net",
          "Status",
          "Transfer ID",
        ]}
        items={payouts}
        minWidthClassName="min-w-[720px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(item) => (
          <tr className="border-t" key={item.id}>
            <td className="p-3">{item.cleaner?.full_name}</td>
            <td>
              {item.period_start}, {item.period_end}
            </td>
            <td>{item.total_jobs}</td>
            <td>{formatMoney(item.gross_amount)}</td>
            <td className="font-semibold">{formatMoney(item.net_amount)}</td>
            <td className="capitalize">{item.status}</td>
            <td className="font-mono text-xs">
              {item.stripe_transfer_id ?? "—"}
            </td>
          </tr>
        )}
        tableClassName="overflow-x-auto rounded-[1.25rem] border border-[#e8e0f4] bg-white shadow-[0_8px_20px_rgba(49,44,121,0.04)]"
      />
    </>
  );
}
