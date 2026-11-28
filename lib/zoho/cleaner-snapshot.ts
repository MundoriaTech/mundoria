import { readDocumentReviews, type CleanerDocumentKind } from "@/lib/cleaner/document-reviews";
import { parseDocumentUrls } from "@/lib/cleaner/document-urls";
import { formatServiceName } from "@/lib/customer/services";
import { appUrl } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";
import {
  RECRUIT_ACTIVATION,
  RECRUIT_ASSESSMENT,
  RECRUIT_CALL_STATUS,
  RECRUIT_DOCUMENT_STATUS,
  RECRUIT_LIFECYCLE,
  RECRUIT_ONBOARDING,
  zohoDateTime,
} from "@/lib/zoho/mapping";

/**
 * The whole Recruit picture of one cleaner, worked out from Mundoria's own
 * record: lifecycle stage, each document, the onboarding call, activation
 * review and the application answers. Sent as one upsert, so whatever the
 * admin (or the cleaner) changed, Recruit ends up matching Mundoria.
 */

type Row = Record<string, unknown>;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOC_LABELS: Record<CleanerDocumentKind, string> = {
  dbs: "DBS",
  headshot: "Photo",
  id: "Photo ID",
  insurance: "Insurance",
  right_to_work: "Right to work",
  utr: "UTR",
};

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function clip(value: string | null, max: number) {
  return value ? value.slice(0, max) : null;
}

type DocState = { kind: CleanerDocumentKind; status: string; uploaded: boolean };

function documentStatus(doc: DocState) {
  switch (doc.status) {
    case "verified":
      return RECRUIT_DOCUMENT_STATUS.approved;
    case "rejected":
      return RECRUIT_DOCUMENT_STATUS.rejected;
    case "expired":
      return RECRUIT_DOCUMENT_STATUS.expired;
    case "pending":
      return doc.uploaded ? RECRUIT_DOCUMENT_STATUS.underReview : RECRUIT_DOCUMENT_STATUS.notUploaded;
    default:
      return doc.uploaded ? RECRUIT_DOCUMENT_STATUS.uploaded : RECRUIT_DOCUMENT_STATUS.notUploaded;
  }
}

function documents(row: Row): DocState[] {
  const str = (key: string) => text(row[key]);
  return [
    { kind: "id", status: str("id_document_status") ?? "missing", uploaded: parseDocumentUrls(str("id_document_url")).some(Boolean) },
    { kind: "right_to_work", status: str("right_to_work_status") ?? "missing", uploaded: Boolean(str("right_to_work_route")) },
    { kind: "headshot", status: str("headshot_status") ?? "missing", uploaded: Boolean(str("headshot_url")) },
    { kind: "dbs", status: str("dbs_document_status") ?? "missing", uploaded: Boolean(str("dbs_document_url") || str("dbs_path")) },
    { kind: "insurance", status: str("insurance_status") ?? "missing", uploaded: Boolean(str("insurance_certificate_url") || str("insurance_path")) },
    { kind: "utr", status: str("utr_document_status") ?? "missing", uploaded: Boolean(str("utr_document_url") || str("utr_path")) },
  ];
}

/** Photo ID, right to work and photo are always needed; others once uploaded. */
const ALWAYS_REQUIRED = new Set<CleanerDocumentKind>(["id", "right_to_work", "headshot"]);

export function buildCleanerSnapshot(input: {
  areas: string[];
  availability: Array<{ day_of_week: number; end_time: string | null; is_available: boolean | null; start_time: string | null }>;
  cleaner: Row;
  services: string[];
}) {
  const { cleaner } = input;
  const status = text(cleaner.status) ?? "pending";
  const interview = text(cleaner.interview_status) ?? "not_started";
  const docs = documents(cleaner);
  const reviews = readDocumentReviews(cleaner.verification_flags as Row | null);

  const needsReplacing = docs.filter((doc) => doc.status === "rejected" || doc.status === "expired");
  const underReview = docs.filter((doc) => doc.uploaded && doc.status === "pending");
  const missing = docs.filter((doc) => ALWAYS_REQUIRED.has(doc.kind) && !doc.uploaded);
  const hasUtr = Boolean(text(cleaner.utr_number)) || docs.find((doc) => doc.kind === "utr")?.status === "verified";
  const allApproved =
    !missing.length &&
    docs.every((doc) => (ALWAYS_REQUIRED.has(doc.kind) || doc.uploaded ? doc.status === "verified" : true)) &&
    hasUtr;
  const callDone = interview === "completed";
  const onboardingComplete = cleaner.onboarding_complete === true;
  const started = Boolean(text(cleaner.application_reference)) || docs.some((doc) => doc.uploaded);

  let stage: string;
  if (status === "removed" || interview === "failed") stage = RECRUIT_LIFECYCLE.rejected;
  else if (status === "suspended" || status === "in_training") stage = RECRUIT_LIFECYCLE.onHold;
  else if (status === "certified") stage = RECRUIT_LIFECYCLE.activeCleaner;
  else if (!onboardingComplete) stage = started ? RECRUIT_LIFECYCLE.applicationIncomplete : RECRUIT_LIFECYCLE.accountCreated;
  else if (needsReplacing.length) stage = RECRUIT_LIFECYCLE.documentsPending;
  else if (callDone && allApproved) stage = RECRUIT_LIFECYCLE.onboardingCompleted;
  else if (underReview.length) stage = RECRUIT_LIFECYCLE.documentsUnderReview;
  else if (missing.length || !hasUtr) stage = RECRUIT_LIFECYCLE.documentsPending;
  else if (allApproved && !callDone) stage = RECRUIT_LIFECYCLE.onboardingCall;
  else stage = RECRUIT_LIFECYCLE.applicationSubmitted;

  const activation =
    status === "certified"
      ? RECRUIT_ACTIVATION.approved
      : status === "suspended" || status === "in_training" || status === "removed"
        ? RECRUIT_ACTIVATION.onHold
        : stage === RECRUIT_LIFECYCLE.onboardingCompleted
          ? RECRUIT_ACTIVATION.ready
          : RECRUIT_ACTIVATION.notReady;

  const onboarding =
    status === "certified"
      ? RECRUIT_ONBOARDING.completed
      : status === "suspended" || status === "in_training"
        ? RECRUIT_ONBOARDING.onHold
        : started || onboardingComplete
          ? RECRUIT_ONBOARDING.inProgress
          : RECRUIT_ONBOARDING.notStarted;

  const scheduledAt = text(cleaner.interview_scheduled_at);
  const callStatus =
    interview === "completed" || interview === "failed"
      ? RECRUIT_CALL_STATUS.completed
      : scheduledAt
        ? RECRUIT_CALL_STATUS.scheduled
        : RECRUIT_CALL_STATUS.notScheduled;

  const assessment = cleaner.skills_exam_passed === true
    ? RECRUIT_ASSESSMENT.passed
    : text(cleaner.skills_exam_completed_at)
      ? RECRUIT_ASSESSMENT.retake
      : RECRUIT_ASSESSMENT.notTaken;

  const outstanding = [
    ...needsReplacing.map((doc) => `${DOC_LABELS[doc.kind]} (${doc.status === "expired" ? "expired" : "rejected"})`),
    ...missing.map((doc) => `${DOC_LABELS[doc.kind]} (not uploaded)`),
    ...(hasUtr ? [] : ["UTR (not provided)"]),
  ];
  const instructions = needsReplacing
    .map((doc) => {
      const note = reviews[doc.kind]?.decision === "rejected" ? reviews[doc.kind]?.note : null;
      return note ? `${DOC_LABELS[doc.kind]}: ${note}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const nextAction =
    status === "certified"
      ? "None: active on Mundoria"
      : status === "removed"
        ? `Removed from Mundoria${text(cleaner.certification_notes) ? `: ${text(cleaner.certification_notes)}` : ""}`
        : status === "suspended"
          ? "Suspended on Mundoria: review before reinstating"
          : interview === "failed"
            ? "Onboarding call did not lead to approval"
            : status === "in_training"
              ? `On hold${text(cleaner.certification_notes) ? `: ${text(cleaner.certification_notes)}` : ""}`
              : !onboardingComplete
                ? "Waiting for the cleaner to finish the application"
                : underReview.length
                  ? `Review ${underReview.map((doc) => DOC_LABELS[doc.kind]).join(", ")} in Mundoria admin${
                      outstanding.length ? `; waiting for the cleaner: ${outstanding.join(", ")}` : ""
                    }`
                  : outstanding.length
                    ? `Waiting for the cleaner: ${outstanding.join(", ")}`
                    : !callDone
                      ? scheduledAt
                        ? "Hold the onboarding call"
                        : "Book the onboarding call"
                      : "Approve for live jobs in Mundoria admin";

  const availability = input.availability
    .filter((slot) => slot.is_available !== false && slot.start_time && slot.end_time)
    .sort((a, b) => ((a.day_of_week + 6) % 7) - ((b.day_of_week + 6) % 7))
    .map((slot) => `${DAYS[slot.day_of_week] ?? slot.day_of_week} ${String(slot.start_time).slice(0, 5)}–${String(slot.end_time).slice(0, 5)}`)
    .join("; ");

  const specialities = [
    ...input.services.map((service) => {
      try {
        return formatServiceName(service as ServiceType);
      } catch {
        return service;
      }
    }),
    ...list(cleaner.cleaning_skills),
  ];
  const equipment = [
    list(cleaner.equipment_owned).length ? `Equipment: ${list(cleaner.equipment_owned).join(", ")}` : null,
    text(cleaner.equipment_other) ? `Other equipment: ${text(cleaner.equipment_other)}` : null,
    list(cleaner.products_owned).length ? `Products: ${list(cleaner.products_owned).join(", ")}` : null,
    list(cleaner.specialised_equipment).length ? `Specialist: ${list(cleaner.specialised_equipment).join(", ")}` : null,
    text(cleaner.can_transport_equipment) ? `Can carry equipment: ${text(cleaner.can_transport_equipment)}` : null,
  ].filter(Boolean).join("\n");

  const fields: Record<string, unknown> = {
    Activation_Review: activation,
    Assessment_Result: assessment,
    Cleaner_Lifecycle_Stage: stage,
    Documents_Awaiting_Approval: underReview.length,
    Government_ID_Status: documentStatus(docs[0]),
    Mundoria_User_ID: text(cleaner.id),
    Next_Operations_Action: clip(nextAction, 255),
    Onboarding_Call_Status: callStatus,
    Onboarding_Completion_Status: onboarding,
    Outstanding_Document_Count: outstanding.length,
    Outstanding_Documents: clip(outstanding.join(", ") || null, 255),
    Photograph_Status: documentStatus(docs[2]),
    Right_to_Work_Status: documentStatus(docs[1]),
    DBS_Status: documentStatus(docs[3]),
    Insurance_Status: documentStatus(docs[4]),
    // A UTR typed in (no document) counts as provided, not as checked.
    UTR_Status: hasUtr && !docs[5].uploaded ? RECRUIT_DOCUMENT_STATUS.uploaded : documentStatus(docs[5]),
    Document_Replacement_Instructions: instructions || null,
    Secure_Cleaner_Record: `${appUrl()}/admin/cleaners/${String(cleaner.id)}`,
  };
  if (typeof cleaner.skills_exam_score === "number") fields.Assessment_Score = Math.round(cleaner.skills_exam_score);
  if (text(cleaner.insurance_expiry_date)) fields.Insurance_Expiry = String(cleaner.insurance_expiry_date).slice(0, 10);
  if (scheduledAt) fields.Onboarding_Call_At = zohoDateTime(scheduledAt);
  if (text(cleaner.application_reference)) fields.Application_Reference = text(cleaner.application_reference);
  if (input.areas.length) fields.Service_Areas = clip(input.areas.join(", "), 255);
  if (specialities.length) fields.Cleaning_Specialities = clip(specialities.join(", "), 255);
  if (text(cleaner.bio)) fields.Cleaner_Bio = clip(text(cleaner.bio), 2000);
  if (availability) fields.Cleaner_Availability = clip(availability, 2000);
  if (equipment) fields.Equipment_and_Products = clip(equipment, 2000);
  return fields;
}

/** Load everything the snapshot needs for one cleaner. Null when gone. */
export async function loadCleanerSnapshot(cleanerId: string) {
  const admin = createAdminClient();
  const [profile, cleaner, services, areas, availability] = await Promise.all([
    admin.from("profiles").select("email,full_name,phone,role").eq("id", cleanerId).maybeSingle(),
    admin.from("cleaner_profiles").select("*").eq("id", cleanerId).maybeSingle(),
    admin.from("cleaner_services").select("service_type").eq("cleaner_id", cleanerId).eq("is_active", true),
    admin.from("cleaner_working_areas").select("postcode_prefix").eq("cleaner_id", cleanerId),
    admin.from("cleaner_availability").select("day_of_week,start_time,end_time,is_available").eq("cleaner_id", cleanerId),
  ]);
  if (!profile.data?.email || !cleaner.data) return null;
  return {
    fields: buildCleanerSnapshot({
      areas: (areas.data ?? []).map((row) => String(row.postcode_prefix)).filter(Boolean),
      availability: (availability.data ?? []) as Parameters<typeof buildCleanerSnapshot>[0]["availability"],
      cleaner: cleaner.data as Row,
      services: (services.data ?? []).map((row) => String(row.service_type)),
    }),
    person: {
      email: String(profile.data.email),
      fullName: String(profile.data.full_name ?? ""),
      phone: (profile.data.phone as string | null) ?? null,
      userId: cleanerId,
    },
  };
}
