import Link from "next/link";

import { AppPage } from "@/components/shared/app-page";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CHECKS = [
  { column: "utr_document_status", label: "UTR" },
  { column: "dbs_document_status", label: "DBS" },
  { column: "insurance_status", label: "Insurance" },
] as const;

export default async function AdminVerificationQueuePage() {
  const { data } = await createAdminClient()
    .from("cleaner_profiles")
    .select(
      "id,status,utr_document_status,dbs_document_status,insurance_status,insurance_expiry_date,verification_flags,updated_at,profile:profiles!cleaner_profiles_id_fkey(full_name,email)",
    )
    .or(
      "utr_document_status.eq.pending,dbs_document_status.eq.pending,insurance_status.eq.pending",
    )
    .order("updated_at", { ascending: true })
    .limit(200);

  const rows = data ?? [];

  return (
    <AppPage
      className="space-y-6"
      description={
        <>
          Cleaners with a UTR, DBS or insurance document waiting for review.
          Oldest updates first. {rows.length} in the queue.
        </>
      }
      eyebrow="People"
      title="Verification"
    >

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Cleaner</th>
              {CHECKS.map((check) => (
                <th className="px-4 py-3 font-medium" key={check.column}>
                  {check.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={6}>
                  Nothing waiting for verification.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const profile = Array.isArray(row.profile)
                  ? row.profile[0]
                  : row.profile;
                const flags = Object.entries(
                  (row.verification_flags ?? {}) as Record<string, unknown>,
                )
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
                      <p className="text-xs text-muted-foreground">
                        {profile?.email}
                      </p>
                    </td>
                    {CHECKS.map((check) => {
                      const value = String(
                        (row as Record<string, unknown>)[check.column] ??
                          "missing",
                      );
                      return (
                        <td className="px-4 py-3" key={check.column}>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                              value === "pending" &&
                                "bg-amber-100 text-amber-900",
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
                      {flags.length ? flags.join(", ") : (
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
              })
            )}
          </tbody>
        </table>
      </div>
    </AppPage>
  );
}
