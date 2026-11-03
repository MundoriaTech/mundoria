"use client";

import Link from "next/link";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const CHECKS = [
  { column: "utr_document_status", label: "UTR" },
  { column: "dbs_document_status", label: "DBS" },
  { column: "insurance_status", label: "Insurance" },
] as const;

export type VerificationQueueRow = {
  dbs_document_status: string | null;
  id: string;
  insurance_expiry_date: string | null;
  insurance_status: string | null;
  profile:
    | { email: string | null; full_name: string | null }
    | { email: string | null; full_name: string | null }[]
    | null;
  status: string;
  updated_at: string | null;
  utr_document_status: string | null;
  verification_flags: Record<string, unknown> | null;
};

export function VerificationQueueTable({
  rows,
}: {
  rows: VerificationQueueRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <PagedTable
        empty="Nothing waiting for verification."
        headers={["Cleaner", "UTR", "DBS", "Insurance", "Flags", "Updated"]}
        items={rows}
        minWidthClassName="min-w-[720px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => {
          const profile = Array.isArray(row.profile)
            ? row.profile[0]
            : row.profile;
          const flags = Object.entries(row.verification_flags ?? {})
            .filter(([, on]) => Boolean(on))
            .map(([flag]) => flag.replaceAll("_", " "));
          return (
            <tr className="border-b last:border-0" key={row.id}>
              <td className="px-4 py-3">
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  href={`/admin/cleaners/${row.id}`}
                >
                  {profile?.full_name ?? "Cleaner"}
                </Link>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </td>
              {CHECKS.map((check) => {
                const value = String(row[check.column] ?? "missing");
                return (
                  <td className="px-4 py-3" key={check.column}>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        value === "pending" && "bg-amber-100 text-amber-900",
                        value === "verified" &&
                          "bg-emerald-100 text-emerald-900",
                        (value === "rejected" || value === "expired") &&
                          "bg-red-100 text-red-800",
                        value === "missing" &&
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {value}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-3 text-xs capitalize text-red-800">
                {flags.length ? (
                  flags.join(", ")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {row.updated_at
                  ? new Date(row.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
