import { notFound } from "next/navigation";

import { CleanerActions } from "@/components/admin/cleaner-actions";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCleanerPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const [
    { data: profile },
    { data: cleaner },
    { data: history },
    { data: medallionEvents },
    { data: bookings },
    { data: ratings },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).single(),
    admin.from("cleaner_profiles").select("*").eq("id", params.id).single(),
    admin.from("performance_history").select("*").eq("cleaner_id", params.id).order("month", { ascending: false }),
    admin.from("cleaner_medallion_events").select("*").eq("cleaner_id", params.id).order("created_at", { ascending: false }),
    admin.from("bookings").select("*").eq("cleaner_id", params.id).order("scheduled_date", { ascending: false }),
    admin.from("ratings").select("*").eq("cleaner_id", params.id).order("created_at", { ascending: false }),
  ]);
  if (!profile || !cleaner) notFound();
  const signed = await Promise.all(
    [
      ["DBS certificate", cleaner.dbs_document_url],
      ["Government ID", cleaner.id_document_url],
    ].map(async ([label, path]) => {
      if (!path) return { label, url: null };
      const { data } = await admin.storage
        .from("cleaner-documents")
        .createSignedUrl(path, 60 * 30);
      return { label, url: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{profile.full_name}</h1>
        <p className="text-muted-foreground">{profile.email} · {profile.phone}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_.65fr]">
        <section className="rounded-xl border bg-card p-5">
          <div className="flex justify-between">
            <div>
              <p>{cleaner.bio}</p>
              <p className="mt-3 text-sm text-muted-foreground">{cleaner.years_experience ?? 0} years experience</p>
            </div>
            <TierBadge tier={cleaner.tier} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            <Metric label="Performance score" value={cleaner.medallion_score ?? 0} />
            <Metric label="Jobs completed" value={cleaner.total_jobs} />
            <Metric
              label="Status"
              value={String(cleaner.status).replaceAll("_", " ")}
            />
          </div>
        </section>
        <CleanerActions
          cleanerId={params.id}
          currentStatus={cleaner.status}
          currentTier={cleaner.tier}
        />
      </div>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Documents</h2>
        <div className="mt-4 flex gap-3">
          {signed.map((document) =>
            document.url ? (
              <a className="rounded-md border px-4 py-2 text-sm text-primary" href={document.url} key={document.label} target="_blank">
                View {document.label}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground" key={document.label}>{document.label}: missing</span>
            ),
          )}
        </div>
      </section>
      <DataTable
        headers={["Date", "Event", "Score", "Tier change", "Notes"]}
        rows={(medallionEvents ?? []).map((item) => [
          new Date(item.created_at).toLocaleDateString("en-GB"),
          item.event_type.replaceAll("_", " "),
          `${item.score_before ?? "—"} → ${item.score_after ?? "—"}`,
          `${item.tier_before ?? "—"} → ${item.tier_after ?? "—"}`,
          item.notes ?? "—",
        ])}
        title="Account history"
      />
      <DataTable
        headers={["Month", "Score", "Tier change", "Jobs"]}
        rows={(history ?? []).map((item) => [
          item.month,
          item.total_score,
          `${item.tier_before} → ${item.tier_after}`,
          item.jobs_completed,
        ])}
        title="Performance history"
      />
      <DataTable
        headers={["Date", "Service", "Status", "Net"]}
        rows={(bookings ?? []).map((item) => [
          item.scheduled_date,
          formatServiceName(item.service_type),
          item.status,
          formatMoney(item.amount_cleaner),
        ])}
        title="Booking history"
      />
      <DataTable
        headers={["Date", "Mood", "Internal score", "Status", "Comment"]}
        rows={(ratings ?? []).map((item) => [
          new Date(item.created_at).toLocaleDateString("en-GB"),
          item.mood ?? item.overall_score,
          item.internal_score ?? "—",
          item.application_status ?? "applied",
          item.comment ?? "—",
        ])}
        title="Mood ratings"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-muted p-3"><b>{value}</b><small className="block text-muted-foreground">{label}</small></div>;
}

function DataTable({ headers, rows, title }: { headers: string[]; rows: (string | number | null)[][]; title: string }) {
  return (
    <section className="overflow-x-auto rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <table className="w-full min-w-[600px] text-sm">
        <thead><tr>{headers.map((header) => <th className="border-b p-2 text-left" key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="border-b p-2" key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </section>
  );
}
