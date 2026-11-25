"use client";

import Link from "next/link";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ukDateTime } from "@/lib/admin/format";

export type LeadListRow = {
  callback_requested_at: string | null;
  created_at: string;
  email: string | null;
  id: string;
  last_activity: string;
  name: string;
  needs_human: boolean;
  needs_human_reason: string | null;
  phone: string | null;
  source: string;
  status: string;
  utm: string;
};

const STATUS_STYLE: Record<string, string> = {
  booked: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  contacted: "bg-sky-50 text-sky-800 ring-sky-200",
  engaged: "bg-violet-50 text-violet-800 ring-violet-200",
  lost: "bg-slate-100 text-slate-600 ring-slate-200",
  new: "bg-amber-50 text-amber-800 ring-amber-200",
  unsubscribed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
        STATUS_STYLE[status] ?? STATUS_STYLE.new,
      )}
    >
      {status}
    </span>
  );
}

/** UK time, with the year, so server and browser render the same. */
export function formatWhen(iso: string | null) {
  if (!iso) return "–";
  return ukDateTime(iso);
}

export function LeadsTable({ rows, resetKey }: { rows: LeadListRow[]; resetKey: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <PagedTable
        empty="No leads in this view."
        headers={["Lead", "Contact", "Source", "Status", "Last activity", "Created"]}
        items={rows}
        minWidthClassName="min-w-[960px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => (
          <tr className="border-b last:border-0" key={row.id}>
            <td className="px-4 py-3">
              <Link className="font-medium text-[#312c79] hover:underline" href={`/admin/leads/${row.id}`}>
                {row.name || row.email || row.phone || "Unnamed lead"}
              </Link>
              {row.needs_human ? (
                <p className="mt-0.5 text-xs font-semibold text-[#9a3412]">
                  Needs a person{row.needs_human_reason ? `: ${row.needs_human_reason}` : ""}
                </p>
              ) : row.callback_requested_at ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Callback requested {formatWhen(row.callback_requested_at)}</p>
              ) : null}
            </td>
            <td className="px-4 py-3 text-sm">
              <p className="break-all">{row.email ?? "–"}</p>
              <p className="whitespace-nowrap text-muted-foreground">{row.phone ?? ""}</p>
            </td>
            <td className="px-4 py-3 text-sm">
              <p>{row.source}</p>
              {row.utm ? <p className="text-xs text-muted-foreground">{row.utm}</p> : null}
            </td>
            <td className="px-4 py-3">
              <LeadStatusBadge status={row.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm">{formatWhen(row.last_activity)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-sm">{formatWhen(row.created_at)}</td>
          </tr>
        )}
        resetKey={resetKey}
      />
    </div>
  );
}
