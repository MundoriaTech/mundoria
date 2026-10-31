"use client";

import Link from "next/link";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  customer_behaviour: "Customer behaviour",
  injury: "Injury or illness",
  other: "Other",
  property_damage: "Property damage",
  theft: "Theft or missing items",
  unsafe_condition: "Unsafe condition",
};

export type IncidentRow = {
  category: string;
  cleaner: { full_name: string | null } | { full_name: string | null }[] | null;
  created_at: string;
  id: string;
  riddor_required: boolean | null;
  severity: string;
  status: string;
  title: string;
};

export function IncidentsTable({ rows }: { rows: IncidentRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <PagedTable
        empty="No incidents reported yet."
        headers={[
          "Reported",
          "Cleaner",
          "Incident",
          "Severity",
          "Status",
          "RIDDOR",
        ]}
        items={rows}
        minWidthClassName="min-w-[720px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => {
          const cleaner = Array.isArray(row.cleaner)
            ? row.cleaner[0]
            : row.cleaner;
          return (
            <tr className="border-b last:border-0" key={row.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  href={`/admin/incidents/${row.id}`}
                >
                  {new Date(row.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                  })}
                </Link>
              </td>
              <td className="px-4 py-3">{cleaner?.full_name ?? "—"}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[row.category] ?? row.category}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                    row.severity === "emergency" && "bg-red-100 text-red-800",
                    row.severity === "urgent" && "bg-amber-100 text-amber-900",
                    row.severity === "standard" &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {row.severity}
                </span>
              </td>
              <td className="px-4 py-3 capitalize">
                {String(row.status).replaceAll("_", " ")}
              </td>
              <td className="px-4 py-3">
                {row.riddor_required ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                    Flagged
                  </span>
                ) : (
                  <span className="text-muted-foreground">, </span>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
