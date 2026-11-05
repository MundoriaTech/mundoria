"use client";

import Link from "next/link";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export type AbandonedBookingLeadRow = {
  completed_at: string | null;
  completed_booking_id: string | null;
  created_at: string;
  current_step: string | null;
  email: string;
  id: string;
  last_reminded_at: string | null;
  reminder_count: number;
  service_label: string | null;
  user_id: string | null;
};

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stepLabel(step: string | null) {
  if (!step) return "—";
  return step.replaceAll("_", " ");
}

export function AbandonedBookingLeadsTable({
  rows,
}: {
  rows: AbandonedBookingLeadRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <PagedTable
        empty="No finish-your-booking emails have been sent yet."
        headers={[
          "Email",
          "Last emailed",
          "Reminders",
          "Last step",
          "Service",
          "Account",
          "Status",
        ]}
        items={rows}
        minWidthClassName="min-w-[920px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => {
          const completed = Boolean(row.completed_at);
          return (
            <tr className="border-b last:border-0" key={row.id}>
              <td className="px-4 py-3">
                <p className="font-medium break-all">{row.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Lead since {formatWhen(row.created_at)}
                </p>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {formatWhen(row.last_reminded_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {row.reminder_count} / 2
              </td>
              <td className="px-4 py-3 capitalize">
                {stepLabel(row.current_step)}
              </td>
              <td className="px-4 py-3">{row.service_label ?? "—"}</td>
              <td className="px-4 py-3">
                {row.user_id ? (
                  <Link
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    href={`/admin/customer/${row.user_id}`}
                  >
                    Signed up
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Guest</span>
                )}
              </td>
              <td className="px-4 py-3">
                {completed ? (
                  <span className="inline-flex flex-col gap-1">
                    <span
                      className={cn(
                        "w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900",
                      )}
                    >
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
  );
}
