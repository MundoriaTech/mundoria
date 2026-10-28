import Link from "next/link";

import { AppPage } from "@/components/shared/app-page";
import { EmptyState } from "@/components/shared/empty-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  customer_behaviour: "Customer behaviour",
  injury: "Injury or illness",
  other: "Other",
  property_damage: "Property damage",
  theft: "Theft or missing items",
  unsafe_condition: "Unsafe condition",
};

export default async function AdminIncidentsPage() {
  const { data } = await createAdminClient()
    .from("cleaner_incidents")
    .select(
      "id,title,category,severity,status,riddor_required,created_at,cleaner:profiles!cleaner_incidents_cleaner_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data ?? [];
  const open = rows.filter(
    (row) => row.status !== "resolved" && row.status !== "closed",
  ).length;

  return (
    <AppPage
      className="space-y-6"
      description={
        <>
          Incidents reported by cleaners. {open} open. Flag anything that may
          need RIDDOR reporting.
        </>
      }
      eyebrow="Operations"
      title="Incidents"
    >

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reported</th>
              <th className="px-4 py-3 font-medium">Cleaner</th>
              <th className="px-4 py-3 font-medium">Incident</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">RIDDOR</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4" colSpan={6}>
                  <EmptyState
                    compact
                    icon="shield"
                    message="Reports from cleaners will show here with severity and RIDDOR flags."
                    title="No incidents reported yet"
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
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
                          row.severity === "emergency" &&
                            "bg-red-100 text-red-800",
                          row.severity === "urgent" &&
                            "bg-amber-100 text-amber-900",
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
                        <span className="text-muted-foreground">—</span>
                      )}
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
