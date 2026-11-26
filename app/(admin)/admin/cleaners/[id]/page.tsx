import {
  formatShareCode,
  RIGHT_TO_WORK_CHECK_URL,
  RIGHT_TO_WORK_ROUTE_LABELS,
  type RightToWorkRoute,
  visaRestrictsSelfEmployment,
  visaTypeLabel,
  rightToWorkRestrictionLabel,
} from "@/lib/cleaner/right-to-work";
import { notFound, redirect } from "next/navigation";

import { CleanerApplicationRecord } from "@/components/admin/cleaner-application-record";
import { CleanerReviewPanel } from "@/components/admin/cleaner-review-panel";
import { DocumentChecksSection } from "@/components/admin/document-checks-section";
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
import { adminCleanerStatusLabel } from "@/lib/admin/cleaner-status";
import {
  adminVisibleVerificationFlags,
  documentReviewNoteFor,
} from "@/lib/cleaner/document-reviews";
import { parseDocumentList } from "@/lib/cleaner/document-urls";
import {
  DBS_CHECK_URL,
  verificationLifecycleLabel,
} from "@/lib/cleaner/onboarding-compliance";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { CleanerTier, InterviewStatus } from "@/types/cleaner";

export default async function AdminCleanerPage({
  params,
}: {
  params: { id: string };
}) {
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
    { data: services },
    { data: areas },
    { data: availability },
    eligibility,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).single(),
    admin.from("cleaner_profiles").select("*").eq("id", params.id).single(),
    admin
      .from("performance_history")
      .select("*")
      .eq("cleaner_id", params.id)
      .order("month", { ascending: false }),
    admin
      .from("cleaner_medallion_events")
      .select("*")
      .eq("cleaner_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("bookings")
      .select("*")
      .eq("cleaner_id", params.id)
      .order("scheduled_date", { ascending: false }),
    admin
      .from("ratings")
      .select("*")
      .eq("cleaner_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("user_activity_events")
      .select("id, event_name, path, metadata, created_at")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("cleaner_services")
      .select("service_type")
      .eq("cleaner_id", params.id)
      .eq("is_active", true),
    admin
      .from("cleaner_working_areas")
      .select("postcode_prefix,latitude,longitude")
      .eq("cleaner_id", params.id),
    admin
      .from("cleaner_availability")
      .select("day_of_week,start_time,end_time,is_available")
      .eq("cleaner_id", params.id)
      .order("day_of_week", { ascending: true }),
    getHardDeleteEligibility({
      actorAdminId: user.id,
      userId: params.id,
    }),
  ]);
  if (!profile || !cleaner) notFound();
  const dbsSlots = parseDocumentList(cleaner.dbs_document_url);
  const idSlots = parseDocumentList(cleaner.id_document_url);
  const dbsFilled = dbsSlots;
  const idFilled = idSlots;
  const documentEntries: Array<[string, string | null, "storage" | "public"]> =
    [
      ...(dbsFilled.length
        ? dbsSlots.flatMap(
            (
              path,
              index,
            ): Array<[string, string | null, "storage" | "public"]> =>
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
            (
              path,
              index,
            ): Array<[string, string | null, "storage" | "public"]> =>
              path
                ? [
                    [
                      idSlots.length === 2
                        ? `ID ${index === 0 ? "front" : "back"}`
                        : idSlots.length > 1
                          ? `ID page ${index + 1}`
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
  const verificationFlags =
    (cleaner.verification_flags ?? {}) as Record<string, unknown>;
  const verificationFlagList = adminVisibleVerificationFlags(verificationFlags);
  const signed = await Promise.all(
    documentEntries.map(async ([label, path, kind]) => {
      if (!path)
        return {
          label,
          path: null as string | null,
          url: null as string | null,
        };
      if (kind === "public" || path.startsWith("http")) {
        return { label, path, url: path };
      }
      const { data } = await admin.storage
        .from("cleaner-documents")
        .createSignedUrl(path, 60 * 30);
      return { label, path, url: data?.signedUrl ?? null };
    }),
  );

  const docsByPrefix = {
    dbs: signed.filter((doc) => doc.label.startsWith("DBS")),
    headshot: signed.filter((doc) => doc.label === "Headshot"),
    id: signed.filter((doc) => doc.label.startsWith("ID") || doc.label === "Government ID"),
    insurance: signed.filter((doc) => doc.label.startsWith("Insurance")),
    utr: signed.filter((doc) => doc.label.startsWith("UTR")),
  };

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
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
              {adminCleanerStatusLabel(cleaner.status)}
            </span>
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">
            {profile.email}
            {profile.phone ? ` · ${profile.phone}` : " · No phone"}
          </p>
        </div>
      </div>

      <CleanerReviewPanel
        bio={cleaner.bio}
        cleanerId={params.id}
        currentStatus={cleaner.status}
        currentTier={cleaner.tier as CleanerTier}
        documentChecks={[
          {
            done: cleaner.utr_document_status === "verified",
            label: "UTR",
            detail: reviewLabel(cleaner.utr_document_status, cleaner.utr_path, {
              kind: "utr",
            }),
          },
          {
            done: cleaner.dbs_document_status === "verified",
            label: "DBS",
            detail: reviewLabel(cleaner.dbs_document_status, cleaner.dbs_path, {
              kind: "dbs",
            }),
          },
          {
            done: cleaner.insurance_status === "verified",
            label: "Insurance",
            detail: reviewLabel(cleaner.insurance_status, cleaner.insurance_path, {
              kind: "insurance",
            }),
          },
          {
            done: cleaner.id_document_status === "verified",
            label: "Government ID",
            detail: reviewLabel(cleaner.id_document_status),
          },
          {
            done: cleaner.headshot_status === "verified",
            label: "Headshot",
            detail: reviewLabel(cleaner.headshot_status),
          },
          {
            // Same rule as the server: a share code also needs the GOV.UK
            // result (restricted / non-restricted work) recorded.
            done:
              cleaner.right_to_work_status === "verified" &&
              (cleaner.right_to_work_route !== "share_code" ||
                cleaner.right_to_work_restriction === "restricted" ||
                cleaner.right_to_work_restriction === "unrestricted"),
            label: "Right to work",
            detail: [
              reviewLabel(cleaner.right_to_work_status),
              rightToWorkRestrictionLabel(cleaner.right_to_work_restriction) ??
                (cleaner.right_to_work_status === "verified" &&
                cleaner.right_to_work_route === "share_code"
                  ? "record the GOV.UK result (restricted or non-restricted work)"
                  : null),
            ]
              .filter(Boolean)
              .join(" · "),
          },
        ]}
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

      <DocumentChecksSection
        cleanerId={params.id}
        items={[
          {
            detail: [
              cleaner.utr_number,
              reviewLabel(cleaner.utr_document_status, cleaner.utr_path, {
                kind: "utr",
              }),
            ]
              .filter(Boolean)
              .join(" · "),
            documents: docsByPrefix.utr,
            kind: "utr",
            note: documentReviewNoteFor(verificationFlags, "utr")?.note,
            status: cleaner.utr_document_status,
          },
          {
            checkLink: {
              href: DBS_CHECK_URL,
              label: "Check DBS",
            },
            detail: [
              reviewLabel(cleaner.dbs_document_status, cleaner.dbs_path, {
                kind: "dbs",
              }),
              cleaner.dbs_certificate_number,
            ]
              .filter(Boolean)
              .join(" · "),
            documents: docsByPrefix.dbs,
            facts: [
              ...(cleaner.dbs_certificate_number
                ? [
                    {
                      label: "Certificate number",
                      value: cleaner.dbs_certificate_number,
                    },
                  ]
                : []),
              ...(cleaner.dbs_issued_on
                ? [
                    {
                      label: "Issued on",
                      value: formatUkDate(cleaner.dbs_issued_on),
                    },
                  ]
                : []),
            ],
            kind: "dbs",
            note: documentReviewNoteFor(verificationFlags, "dbs")?.note,
            status: cleaner.dbs_document_status,
          },
          {
            detail: [
              reviewLabel(cleaner.insurance_status, cleaner.insurance_path, {
                kind: "insurance",
              }),
              cleaner.insurance_provider,
              cleaner.insurance_cover_amount
                ? `£${cleaner.insurance_cover_amount}`
                : null,
              cleaner.insurance_expiry_date
                ? `expires ${cleaner.insurance_expiry_date}`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            documents: docsByPrefix.insurance,
            kind: "insurance",
            note: documentReviewNoteFor(verificationFlags, "insurance")?.note,
            status: cleaner.insurance_status,
          },
          {
            detail: idFilled.length
              ? `${idFilled.length} file${idFilled.length === 1 ? "" : "s"} on file`
              : "Not uploaded",
            documents: docsByPrefix.id,
            kind: "id",
            note: documentReviewNoteFor(verificationFlags, "id")?.note,
            status: cleaner.id_document_status,
          },
          {
            detail: cleaner.headshot_url ? "Uploaded" : "Missing",
            documents: docsByPrefix.headshot,
            kind: "headshot",
            note: documentReviewNoteFor(verificationFlags, "headshot")?.note,
            status: cleaner.headshot_status,
          },
          {
            checkLink:
              cleaner.right_to_work_route === "share_code"
                ? {
                    href: RIGHT_TO_WORK_CHECK_URL,
                    label: "Check GOV.UK",
                  }
                : null,
            detail: cleaner.right_to_work_route
              ? [
                  reviewLabel(cleaner.right_to_work_status),
                  rightToWorkRestrictionLabel(
                    cleaner.right_to_work_restriction,
                  ),
                  visaTypeLabel(cleaner.right_to_work_visa_type),
                  cleaner.right_to_work_expires_on
                    ? `expires ${formatUkDate(cleaner.right_to_work_expires_on)}`
                    : cleaner.right_to_work_route === "british_irish"
                      ? "British or Irish"
                      : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Not provided yet",
            documents:
              cleaner.right_to_work_route === "british_irish"
                ? docsByPrefix.id
                : [],
            facts: cleaner.right_to_work_route
              ? [
                  {
                    label: "How they proved it",
                    value:
                      RIGHT_TO_WORK_ROUTE_LABELS[
                        cleaner.right_to_work_route as RightToWorkRoute
                      ],
                  },
                  ...(cleaner.right_to_work_share_code
                    ? [
                        {
                          label: "Share code",
                          value: formatShareCode(
                            cleaner.right_to_work_share_code,
                          ),
                        },
                      ]
                    : []),
                  ...(visaTypeLabel(cleaner.right_to_work_visa_type)
                    ? [
                        {
                          label: "Visa or status",
                          value: visaTypeLabel(cleaner.right_to_work_visa_type)!,
                        },
                      ]
                    : []),
                  ...(cleaner.date_of_birth
                    ? [
                        {
                          label: "Date of birth",
                          value: formatUkDate(cleaner.date_of_birth),
                        },
                      ]
                    : []),
                  {
                    label: "Permission ends",
                    value: cleaner.right_to_work_expires_on
                      ? formatUkDate(cleaner.right_to_work_expires_on)
                      : cleaner.right_to_work_route === "share_code"
                        ? "No end date given"
                        : "Check the passport or birth certificate",
                  },
                  ...(visaRestrictsSelfEmployment(cleaner.right_to_work_visa_type)
                    ? [
                        {
                          label: "Self-employment",
                          value:
                            "This visa usually does not allow self-employment. Check the GOV.UK result before approving.",
                        },
                      ]
                    : []),
                  ...(rightToWorkRestrictionLabel(
                    cleaner.right_to_work_restriction,
                  )
                    ? [
                        {
                          label: "GOV.UK check",
                          value: rightToWorkRestrictionLabel(
                            cleaner.right_to_work_restriction,
                          )!,
                        },
                      ]
                    : []),
                ]
              : undefined,
            kind: "right_to_work",
            note: documentReviewNoteFor(verificationFlags, "right_to_work")?.note,
            requireWorkRestriction:
              cleaner.right_to_work_route === "share_code",
            reviewable: Boolean(cleaner.right_to_work_route),
            status: cleaner.right_to_work_status ?? "missing",
            workRestriction:
              cleaner.right_to_work_restriction === "restricted" ||
              cleaner.right_to_work_restriction === "unrestricted"
                ? cleaner.right_to_work_restriction
                : null,
          },
        ]}
        meta={[
          {
            label: "Application reference",
            value: cleaner.application_reference ?? "-",
          },
          {
            label: "Verification flags",
            value:
              verificationFlagList.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {verificationFlagList.map((flag) => (
                    <span
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                      key={flag}
                    >
                      {flag}
                    </span>
                  ))}
                </span>
              ) : (
                "None"
              ),
          },
          {
            label: "Equipment",
            value: `${
              cleaner.equipment_status === "update_required"
                ? verificationLifecycleLabel(cleaner.equipment_status, null, {
                    kind: "equipment",
                  })
                : cleaner.equipment_status
                  ? String(cleaner.equipment_status).replaceAll("_", " ")
                  : "Not set"
            }${
              cleaner.specialist_review_required
                ? " · specialist review required"
                : ""
            }`,
          },
          {
            label: "Specialist skills",
            value: (cleaner.skills_assessment_status ?? "not set").replaceAll(
              "_",
              " ",
            ),
          },
          {
            label: "Emergency contact",
            value: cleaner.emergency_contact?.name
              ? `${cleaner.emergency_contact.name}${
                  cleaner.emergency_contact.mobile
                    ? ` · ${cleaner.emergency_contact.mobile}`
                    : ""
                }`
              : "Not provided",
          },
          {
            label: "Agreements",
            value:
              Array.isArray(cleaner.agreement_acceptances) &&
              cleaner.agreement_acceptances.length > 0
                ? `${cleaner.agreement_acceptances.length} accepted`
                : "None logged",
          },
        ]}
      />

      <CleanerApplicationRecord
        agreements={
          Array.isArray(cleaner.agreement_acceptances)
            ? cleaner.agreement_acceptances
            : []
        }
        areas={areas ?? []}
        availability={availability ?? []}
        bio={cleaner.bio}
        cleaningSkills={cleaner.cleaning_skills ?? []}
        cleaningSkillsOther={cleaner.cleaning_skills_other}
        dbsCertificateNumber={cleaner.dbs_certificate_number}
        dbsIssuedOn={cleaner.dbs_issued_on}
        dbsPath={cleaner.dbs_path}
        emergency={
          (cleaner.emergency_contact as Record<string, string> | null) ?? null
        }
        equipmentOwned={cleaner.equipment_owned ?? []}
        equipmentOther={cleaner.equipment_other}
        equipmentOwnership={cleaner.equipment_ownership}
        experienceBand={cleaner.experience_band}
        fullName={profile.full_name}
        gender={cleaner.gender}
        insuranceActivityConfirmed={cleaner.insurance_activity_confirmed}
        insuranceInsuredName={cleaner.insurance_insured_name}
        insurancePath={cleaner.insurance_path}
        insurancePolicyNumber={cleaner.insurance_policy_number}
        insuranceProvider={cleaner.insurance_provider}
        interviewScheduledAt={
          (cleaner.interview_scheduled_at as string | null) ?? null
        }
        locationConsentAt={cleaner.location_tracking_consent_at}
        marketingConsentAt={cleaner.marketing_consent_at}
        phone={profile.phone}
        preferredHoursBand={cleaner.preferred_hours_band}
        productsOwned={cleaner.products_owned ?? []}
        productsOther={cleaner.products_other}
        productsOwnership={cleaner.products_ownership}
        reference={{
          company: cleaner.reference_company,
          contactOk: cleaner.reference_contact_ok,
          email: cleaner.reference_email,
          name: cleaner.reference_name,
          phone: cleaner.reference_phone,
          relationship: cleaner.reference_relationship,
        }}
        safetyAcknowledgedAt={cleaner.safety_acknowledged_at}
        services={(services ?? []).map((row) => row.service_type)}
        skillsExamScore={cleaner.skills_exam_score}
        transportMode={cleaner.transport_mode}
        utrNumber={cleaner.utr_number}
        utrPath={cleaner.utr_path}
        workingRadiusKm={cleaner.working_radius_km ?? 0}
        yearsExperience={cleaner.years_experience ?? 0}
      />

      <UserActivityTimeline events={(activity ?? []) as UserActivityRow[]} />

      <PagedHistoryTable
        headers={["Date", "Event", "Score", "Tier change", "Notes"]}
        rows={(medallionEvents ?? []).map((item) => [
          new Date(item.created_at).toLocaleDateString("en-GB"),
          item.event_type.replaceAll("_", " "),
          `${item.score_before ?? "-"} → ${item.score_after ?? "-"}`,
          `${item.tier_before ?? "-"} → ${item.tier_after ?? "-"}`,
          item.notes ?? "-",
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
          item.internal_score ?? "-",
          item.application_status ?? "applied",
          item.comment ?? "-",
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

function formatUkDate(isoDate: string) {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

