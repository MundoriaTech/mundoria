import { notFound, redirect } from "next/navigation";

import { CleanerReviewPanel } from "@/components/admin/cleaner-review-panel";
import { DocumentViewerButton } from "@/components/admin/document-viewer";
import { RemoveUserButton } from "@/components/admin/remove-user-button";
import { PagedHistoryTable } from "@/components/admin/paged-history-table";
import {
  UserActivityTimeline,
  type UserActivityRow,
} from "@/components/admin/user-activity-timeline";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  getHardDeleteEligibility,
  hardDeleteBlockMessage,
} from "@/lib/admin/delete-user";
import { parseDocumentUrls } from "@/lib/cleaner/document-urls";
import { verificationLifecycleLabel } from "@/lib/cleaner/onboarding-compliance";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { CleanerTier, InterviewStatus } from "@/types/cleaner";

const STATUS_LABEL: Record<string, string> = {
  pending: "Needs review",
  in_training: "On hold",
  certified: "Approved",
  active: "Approved",
  suspended: "Suspended",
  removed: "Banned",
};

export default async function AdminCleanerPage({ params }: { params: { id: string } }) {
  const session = createServerClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const [
    { data: profile },
    { data: cleaner },
    { data: history },
    { data: medallionEvents },
    { data: bookings },
    { data: ratings },
    { data: activity },
    eligibility,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).single(),
    admin.from("cleaner_profiles").select("*").eq("id", params.id).single(),
    admin.from("performance_history").select("*").eq("cleaner_id", params.id).order("month", { ascending: false }),
    admin.from("cleaner_medallion_events").select("*").eq("cleaner_id", params.id).order("created_at", { ascending: false }),
    admin.from("bookings").select("*").eq("cleaner_id", params.id).order("scheduled_date", { ascending: false }),
    admin.from("ratings").select("*").eq("cleaner_id", params.id).order("created_at", { ascending: false }),
    admin
      .from("user_activity_events")
      .select("id, event_name, path, metadata, created_at")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100),
    getHardDeleteEligibility({
      actorAdminId: user.id,
      userId: params.id,
    }),
  ]);
  if (!profile || !cleaner) notFound();
  const dbsSlots = parseDocumentUrls(cleaner.dbs_document_url);
  const idSlots = parseDocumentUrls(cleaner.id_document_url);
  const dbsFilled = dbsSlots.filter(Boolean);
  const idFilled = idSlots.filter(Boolean);
  const documentEntries: Array<[string, string | null, "storage" | "public"]> = [
    ...(dbsFilled.length
      ? dbsSlots.flatMap(
          (path, index): Array<[string, string | null, "storage" | "public"]> =>
            path
              ? [
                  [
                    dbsSlots.length > 1
                      ? `DBS page ${index + 1}`
                      : "DBS certificate",
                    path,
                    "storage",
                  ],
                ]
              : [],
        )
      : ([
          ["DBS certificate", null, "storage"],
        ] as Array<[string, string | null, "storage" | "public"]>)),
    ...(idFilled.length
      ? idSlots.flatMap(
          (path, index): Array<[string, string | null, "storage" | "public"]> =>
            path
              ? [
                  [
                    idSlots.length > 1
                      ? `ID ${index === 0 ? "front" : "back"}`
                      : "Government ID",
                    path,
                    "storage",
                  ],
                ]
              : [],
        )
      : ([
          ["Government ID", null, "storage"],
        ] as Array<[string, string | null, "storage" | "public"]>)),
    ["UTR proof", cleaner.utr_document_url ?? null, "storage"],
    [
      "Insurance certificate",
      cleaner.insurance_certificate_url ?? null,
      "storage",
    ],
    ["Headshot", cleaner.headshot_url ?? null, "public"],
  ];

  const reviewLabel = verificationLifecycleLabel;
  const verificationFlagList = Object.entries(
    (cleaner.verification_flags ?? {}) as Record<string, unknown>,
  )
    .filter(([, flagged]) => Boolean(flagged))
    .map(([flag]) => flag);
  const signed = await Promise.all(
    documentEntries.map(async ([label, path, kind]) => {
      if (!path) return { label, path: null as string | null, url: null as string | null };
      if (kind === "public" || path.startsWith("http")) {
        return { label, path, url: path };
      }
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
        hasHeadshot={Boolean(cleaner.headshot_url)}
        hasUtr={Boolean(cleaner.utr_number)}
        onboardingComplete={Boolean(cleaner.onboarding_complete)}
        interviewScheduledAt={
          (cleaner.interview_scheduled_at as string | null) ?? null
        }
        interviewStatus={
          (cleaner.interview_status as InterviewStatus | null) ?? "not_started"
        }
        medallionScore={cleaner.medallion_score ?? 0}
        skillsAssessmentStatus={
          (cleaner.skills_assessment_status as string | null) ?? null
        }
        skillsExamPassed={Boolean(cleaner.skills_exam_passed)}
        skillsExamScore={cleaner.skills_exam_score ?? null}
        specialistReviewRequired={Boolean(cleaner.specialist_review_required)}
        totalJobs={cleaner.total_jobs}
        yearsExperience={cleaner.years_experience ?? 0}
      />

      <UserActivityTimeline
        events={(activity ?? []) as UserActivityRow[]}
      />

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Compliance</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">UTR</dt>
            <dd className="font-medium">
              {cleaner.utr_number
                ? `${cleaner.utr_number} · ${reviewLabel(cleaner.utr_document_status, cleaner.utr_path, { kind: "utr" })}`
                : `${reviewLabel(cleaner.utr_document_status, cleaner.utr_path, { kind: "utr" })}${
                    cleaner.utr_path ? ` · path: ${cleaner.utr_path}` : ""
                  }`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">DBS</dt>
            <dd className="font-medium">
              {reviewLabel(cleaner.dbs_document_status, cleaner.dbs_path, { kind: "dbs" })}
              {cleaner.dbs_certificate_number
                ? ` · ${cleaner.dbs_certificate_number}`
                : ""}
              {cleaner.dbs_path ? ` · path: ${cleaner.dbs_path}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Insurance</dt>
            <dd className="font-medium">
              {reviewLabel(cleaner.insurance_status, cleaner.insurance_path, {
                kind: "insurance",
              })}
              {cleaner.insurance_provider
                ? ` · ${cleaner.insurance_provider}`
                : ""}
              {cleaner.insurance_cover_amount
                ? ` · £${cleaner.insurance_cover_amount}`
                : ""}
              {cleaner.insurance_expiry_date
                ? ` · expires ${cleaner.insurance_expiry_date}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Application reference</dt>
            <dd className="font-medium">
              {cleaner.application_reference ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Verification flags</dt>
            <dd className="font-medium">
              {verificationFlagList.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {verificationFlagList.map((flag) => (
                    <span
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                      key={flag}
                    >
                      {flag.replaceAll("_", " ")}
                    </span>
                  ))}
                </span>
              ) : (
                "None"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Skills assessment</dt>
            <dd className="font-medium capitalize">
              {(cleaner.skills_assessment_status ?? "not set").replaceAll(
                "_",
                " ",
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Equipment status</dt>
            <dd className="font-medium">
              {cleaner.equipment_status === "update_required"
                ? verificationLifecycleLabel(
                    cleaner.equipment_status,
                    null,
                    { kind: "equipment" },
                  )
                : cleaner.equipment_status
                  ? String(cleaner.equipment_status).replaceAll("_", " ")
                  : "Not set"}
              {cleaner.specialist_review_required
                ? " · specialist review required"
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Skills exam</dt>
            <dd className="font-medium">
              {cleaner.skills_exam_passed
                ? `Passed (${cleaner.skills_exam_score ?? "—"})`
                : "Not passed"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Interview</dt>
            <dd className="font-medium capitalize">
              {(cleaner.interview_status ?? "not_started").replaceAll("_", " ")}
              {cleaner.interview_scheduled_at
                ? ` · ${new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    hour: "2-digit",
                    hourCycle: "h23",
                    minute: "2-digit",
                    month: "short",
                    timeZone: "Europe/London",
                    weekday: "short",
                  }).format(new Date(cleaner.interview_scheduled_at as string))}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Emergency contact</dt>
            <dd className="font-medium">
              {cleaner.emergency_contact?.name
                ? `${cleaner.emergency_contact.name}${
                    cleaner.emergency_contact.mobile
                      ? ` · ${cleaner.emergency_contact.mobile}`
                      : ""
                  }`
                : "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Agreements</dt>
            <dd className="font-medium">
              {Array.isArray(cleaner.agreement_acceptances) &&
              cleaner.agreement_acceptances.length > 0
                ? `${cleaner.agreement_acceptances.length} accepted`
                : "None logged"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-medium">{profile.phone ?? "No phone"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Documents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open DBS, ID, UTR, insurance, and headshot without leaving the admin
          portal.
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
      <PagedHistoryTable
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
      <PagedHistoryTable
        headers={["Month", "Score", "Tier change", "Jobs"]}
        rows={(history ?? []).map((item) => [
          item.month,
          item.total_score,
          `${item.tier_before} → ${item.tier_after}`,
          item.jobs_completed,
        ])}
        title="Performance history"
      />
      <PagedHistoryTable
        headers={["Date", "Service", "Status", "Net"]}
        rows={(bookings ?? []).map((item) => [
          item.scheduled_date,
          formatServiceName(item.service_type),
          item.status,
          formatMoney(item.amount_cleaner),
        ])}
        title="Booking history"
      />
      <PagedHistoryTable
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

      <RemoveUserButton
        allowed={eligibility.allowed}
        blockMessage={
          eligibility.blockReason
            ? hardDeleteBlockMessage(eligibility.blockReason)
            : null
        }
        fullName={profile.full_name}
        role="cleaner"
        userId={profile.id}
      />
    </div>
  );
}
