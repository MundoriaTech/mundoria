import { notFound } from "next/navigation";

import { CleanerReviewPanel } from "@/components/admin/cleaner-review-panel";
import { DocumentViewerButton } from "@/components/admin/document-viewer";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CleanerTier } from "@/types/cleaner";

const STATUS_LABEL: Record<string, string> = {
  pending: "Needs review",
  in_training: "On hold",
  certified: "Approved",
  active: "Approved",
  suspended: "Suspended",
  removed: "Banned",
};

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
    (
      [
        ["DBS certificate", cleaner.dbs_document_url],
        ["Government ID", cleaner.id_document_url],
      ] as const
    ).map(async ([label, path]) => {
      if (!path) return { label, path: null as string | null, url: null as string | null };
      const { data } = await admin.storage
        .from("cleaner-documents")
        .createSignedUrl(path, 60 * 30);
      return { label, path, url: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <UserAvatar
          name={profile.full_name}
          seed={profile.id}
          size="lg"
          url={profile.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.full_name}
            </h1>
            <TierBadge size="sm" tier={cleaner.tier as CleanerTier} />
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">
            {profile.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {profile.phone ?? "No phone"}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {STATUS_LABEL[cleaner.status] ?? cleaner.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <CleanerReviewPanel
        bio={cleaner.bio}
        cleanerId={params.id}
        currentStatus={cleaner.status}
        currentTier={cleaner.tier as CleanerTier}
        medallionScore={cleaner.medallion_score ?? 0}
        totalJobs={cleaner.total_jobs}
        yearsExperience={cleaner.years_experience ?? 0}
      />

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Documents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open DBS and ID here without leaving the admin portal.
        </p>
        <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
          {signed.map((document) => (
            <DocumentViewerButton
              className="w-full justify-center sm:w-auto"
              key={document.label}
              label={document.label}
              path={document.path}
              url={document.url}
            />
          ))}
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

function DataTable({
  headers,
  rows,
  title,
}: {
  headers: string[];
  rows: (string | number | null)[][];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr>
              {headers.map((header) => (
                <th className="border-b p-2 text-left first:pl-4 sm:first:pl-2" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td
                    className="border-b p-2 first:pl-4 sm:first:pl-2"
                    key={cellIndex}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <p className="py-4 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : null}
    </section>
  );
}
