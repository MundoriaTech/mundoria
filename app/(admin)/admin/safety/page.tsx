import Link from "next/link";

import { AppPage } from "@/components/shared/app-page";
import { SAFETY_REASON_LABELS } from "@/lib/bookings/safety-alert-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export default async function AdminSafetyPage() {
  const { data } = await createAdminClient()
    .from("booking_safety_alerts")
    .select(
      "id,booking_id,status,reason,raised_by_role,created_at,address_line,acknowledged_at,raised_by_profile:profiles!booking_safety_alerts_raised_by_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <AppPage
      className="space-y-6"
      description="Urgent in-session Safety alerts. Acknowledge open cases quickly."
      eyebrow="Operations"
      title="Safety"
    >

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Raised by</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-muted-foreground"
                  colSpan={6}
                >
                  No safety alerts yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const raiser = Array.isArray(row.raised_by_profile)
                  ? row.raised_by_profile[0]
                  : row.raised_by_profile;
                return (
                  <tr className="border-b last:border-0" key={row.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
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
                          row.status === "acknowledged" &&
                            "bg-amber-100 text-amber-900",
                          row.status === "in_progress" &&
                            "bg-indigo-100 text-indigo-900",
                          row.status === "resolved" &&
                            "bg-emerald-100 text-emerald-900",
                          row.status === "withdrawn" &&
                            "bg-muted text-muted-foreground",
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
              })
            )}
          </tbody>
        </table>
      </div>
    </AppPage>
  );
}
