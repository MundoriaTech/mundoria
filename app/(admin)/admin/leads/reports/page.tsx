import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Lead reports" };
export const dynamic = "force-dynamic";

type Metrics = {
  bookings_won?: number;
  calls_connected?: number;
  calls_placed?: number;
  conversion_rate_percent?: number;
  leads_new?: number;
  replies_received?: number;
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminLeadReportsPage() {
  const { data, error } = await createAdminClient()
    .from("outreach_reports")
    .select("id,period_start,period_end,metrics,summary,created_at")
    .order("period_start", { ascending: false })
    .limit(26);

  return (
    <div className="min-w-0 space-y-5">
      <Link className="text-sm font-semibold text-[#312c79] hover:underline" href="/admin/leads">
        ← All leads
      </Link>
      <p className="text-sm text-muted-foreground">
        A report is written every Monday morning (AI summary plus the numbers) and emailed to every admin.
      </p>
      {error ? (
        <p className="text-sm text-[#9a3412]">Reports could not be loaded. Apply the lead automation migration.</p>
      ) : !(data ?? []).length ? (
        <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          No reports yet. The first one arrives the Monday after automation is switched on.
        </p>
      ) : (
        (data ?? []).map((report) => {
          const metrics = (report.metrics ?? {}) as Metrics;
          const tiles = [
            ["New leads", metrics.leads_new],
            ["Bookings won", metrics.bookings_won],
            ["Conversion", metrics.conversion_rate_percent !== undefined ? `${metrics.conversion_rate_percent}%` : "–"],
            ["Replies", metrics.replies_received],
            ["AI calls connected", `${metrics.calls_connected ?? 0} of ${metrics.calls_placed ?? 0}`],
          ];
          return (
            <article className="space-y-4 rounded-xl border bg-card p-5" key={report.id as string}>
              <h2 className="text-lg font-semibold text-[#1c133b]">
                {day(report.period_start as string)} to {day(new Date(Date.parse(report.period_end as string) - 86400000).toISOString())}
              </h2>
              <div className="grid gap-3 sm:grid-cols-5">
                {tiles.map(([label, value]) => (
                  <div className="rounded-lg bg-[#f7f5fb] px-3 py-2" key={String(label)}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold text-[#1c133b]">{value ?? 0}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-sm leading-6 text-[#4a4460]">
                {String(report.summary)
                  .split(/\n\s*\n/)
                  .map((paragraph, index) => (
                    <p className="whitespace-pre-wrap" key={index}>
                      {paragraph}
                    </p>
                  ))}
              </div>
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-[#312c79]">All numbers</summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[#f7f5fb] p-3 text-xs">
                  {JSON.stringify(report.metrics, null, 2)}
                </pre>
              </details>
            </article>
          );
        })
      )}
    </div>
  );
}
