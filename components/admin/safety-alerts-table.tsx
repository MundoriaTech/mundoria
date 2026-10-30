"use client";

import Link from "next/link";

import { PagedTable } from "@/components/shared/paged-list";
import { SAFETY_REASON_LABELS } from "@/lib/bookings/safety-alert-shared";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export type SafetyAlertRow = {
  acknowledged_at: string | null;
  address_line: string | null;
  booking_id: string;
  created_at: string;
  id: string;
  raised_by_profile: { full_name: string | null } | { full_name: string | null }[] | null;
  raised_by_role: string;
  reason: string;
  status: string;
};

export function SafetyAlertsTable({ rows }: { rows: SafetyAlertRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <PagedTable
        empty="No safety alerts yet."
        headers={["When", "Status", "Reason", "Raised by", "Booking", "Address"]}
        items={rows}
        minWidthClassName="min-w-[720px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => {
          const raiser = Array.isArray(row.raised_by_profile)
            ? row.raised_by_profile[0]
            : row.raised_by_profile;
          return (
            <tr className="border-b last:border-0" key={row.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  href={`/admin/safety/${row.id}`}
                >
                  {new Date(row.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                  })}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                    row.status === "open" && "bg-red-100 text-red-800",
                    row.status === "acknowledged" && "bg-amber-100 text-amber-900",
                    row.status === "in_progress" && "bg-indigo-100 text-indigo-900",
                    row.status === "resolved" && "bg-emerald-100 text-emerald-900",
                    row.status === "withdrawn" && "bg-muted text-muted-foreground",
                  )}
                >
                  {row.status.replaceAll("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                {SAFETY_REASON_LABELS[
                  row.reason as keyof typeof SAFETY_REASON_LABELS
                ] ?? row.reason}
              </td>
              <td className="px-4 py-3">
                {raiser?.full_name ?? "—"}{" "}
                <span className="text-xs text-muted-foreground">
                  ({row.raised_by_role})
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                <Link
                  className="underline-offset-2 hover:underline"
                  href={`/admin/booking/${row.booking_id}`}
                >
                  #{row.booking_id.slice(0, 8)}
                </Link>
              </td>
              <td className="max-w-[14rem] truncate px-4 py-3 text-muted-foreground">
                {row.address_line ?? "—"}
              </td>
            </tr>
          );
        }}
        tableClassName="px-0"
      />
    </div>
  );
}
