"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PagedTable } from "@/components/shared/paged-list";
import { ukDateTime } from "@/lib/admin/format";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export type AbandonedBookingLeadRow = {
  completed_at: string | null;
  completed_booking_id: string | null;
  created_at: string;
  current_step: string | null;
  /** What they had filled in, one answer per line. */
  details: string[];
  email: string;
  full_name: string | null;
  id: string;
  last_reminded_at: string | null;
  phone: string | null;
  /** Prepared by an admin for the customer to confirm. */
  prepared: boolean;
  reminder_count: number;
  service_label: string | null;
  updated_at: string;
  user_id: string | null;
};

const FILTERS = [
  { key: "open", label: "Still open" },
  { key: "booked", label: "Booked after" },
  { key: "all", label: "All" },
] as const;

function stepLabel(step: string | null) {
  if (!step) return "-";
  return step.replaceAll("_", " ");
}

export function AbandonedBookingLeadsTable({
  rows,
}: {
  rows: AbandonedBookingLeadRow[];
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("open");
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        filter === "all" ? true : filter === "booked" ? Boolean(row.completed_at) : !row.completed_at,
      ),
    [filter, rows],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = rows.filter((row) =>
            item.key === "all" ? true : item.key === "booked" ? Boolean(row.completed_at) : !row.completed_at,
          ).length;
          return (
            <button
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                filter === item.key ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <PagedTable
          empty="No booking drafts here."
          headers={["Person", "What they chose", "Last step", "Activity", "Status"]}
          items={visible}
          key={filter}
          minWidthClassName="min-w-[1040px]"
          pageSize={PAGE_SIZES.admin}
          renderRow={(row) => {
            const completed = Boolean(row.completed_at);
            return (
              <tr className="border-b align-top last:border-0" key={row.id}>
                <td className="px-4 py-3">
                  {row.full_name ? <p className="font-medium">{row.full_name}</p> : null}
                  <p className={cn("break-all", row.full_name ? "text-sm text-muted-foreground" : "font-medium")}>
                    <a className="hover:underline" href={`mailto:${row.email}`}>
                      {row.email}
                    </a>
                  </p>
                  {row.phone ? (
                    <p className="text-sm">
                      <a className="text-primary hover:underline" href={`tel:${row.phone}`}>
                        {row.phone}
                      </a>
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs">
                    {row.user_id ? (
                      <Link
                        className="font-medium text-primary underline-offset-2 hover:underline"
                        href={`/admin/customer/${row.user_id}`}
                      >
                        Has an account
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Guest (no account yet)</span>
                    )}
                    {row.prepared ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5">Prepared by admin</span> : null}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <p className="font-medium">{row.service_label ?? "Service not chosen"}</p>
                  {row.details.length ? (
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {row.details.map((line) => (
                        <li className="break-words" key={line}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </td>
                <td className="px-4 py-3 capitalize">{stepLabel(row.current_step)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <p>Started {ukDateTime(row.created_at)}</p>
                  <p className="text-muted-foreground">Last active {ukDateTime(row.updated_at)}</p>
                  <p className="text-muted-foreground">
                    {row.reminder_count
                      ? `${row.reminder_count} reminder${row.reminder_count === 1 ? "" : "s"}, last ${ukDateTime(row.last_reminded_at)}`
                      : "No reminder sent"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {completed ? (
                    <span className="inline-flex flex-col gap-1">
                      <span className="w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        Booked after
                      </span>
                      {row.completed_booking_id ? (
                        <Link
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          href={`/admin/booking/${row.completed_booking_id}`}
                        >
                          View booking
                        </Link>
                      ) : null}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">
                      Still open
                    </span>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>
    </div>
  );
}
