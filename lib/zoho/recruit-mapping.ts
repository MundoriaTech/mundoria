import type { CleanerArea, CleanerAvailability, CleanerProfile, CleanerService } from "@/types/cleaner";
import { parseDocumentUrls } from "@/lib/cleaner/document-urls";

export type RecruitDocumentStatus = "Not Uploaded" | "Uploaded" | "Under Review" | "Approved" | "Rejected" | "Expired";

export function recruitDocumentStatus(status: string | null | undefined, path: string | null | undefined): RecruitDocumentStatus {
  if (!parseDocumentUrls(path).some(Boolean)) return "Not Uploaded";
  if (status === "verified") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "expired") return "Expired";
  // The website's pending state only proves receipt, not that review has started.
  return "Uploaded";
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const text = (value: unknown, limit = 2000) => typeof value === "string" ? value.slice(0, limit) : "";
export const isIsoDate = (value: string | null | undefined): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const dateTime = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().replace(/\.\d{3}Z$/, "+00:00") : null;

/** Website-owned fields only. Never copies raw identity documents, tax numbers or review notes. */
export function cleanerRecruitFields(
  cleaner: CleanerProfile,
  areas: CleanerArea[] = [],
  availability: CleanerAvailability[] = [],
  services: CleanerService[] = [],
  today = new Date().toISOString().slice(0, 10),
) {
  const insuranceExpired = isIsoDate(cleaner.insurance_expiry_date) && cleaner.insurance_expiry_date < today;
  return {
    Mundoria_User_ID: cleaner.id,
    Application_Reference: cleaner.application_reference || null,
    // This timestamp is written by the application submission endpoint.
    Application_Submitted_At: cleaner.onboarding_complete ? dateTime(cleaner.skills_exam_completed_at) : null,
    Cleaner_Bio: text(cleaner.bio),
    Experience_in_Years: cleaner.years_experience,
    Skill_Set: text((cleaner.cleaning_skills ?? []).join(", ")),
    Service_Areas: text(areas.map(area => area.postcode_prefix).filter(Boolean).join(", "), 255),
    Cleaner_Availability: text(availability.filter(slot => slot.is_available).map(slot => `${weekdays[slot.day_of_week]} ${slot.start_time}–${slot.end_time}`).join("\n")),
    Cleaning_Specialities: text(services.filter(service => service.is_active).map(service => service.service_type).join(", "), 255),
    Equipment_and_Products: text([
      `Equipment: ${(cleaner.equipment_owned ?? []).join(", ") || "Not specified"}`,
      `Products: ${(cleaner.products_owned ?? []).join(", ") || "Not specified"}`,
      `Transport: ${cleaner.equipment_transport || "Not specified"}`,
    ].join("\n")),
    Assessment_Result: cleaner.specialist_review_required || cleaner.skills_assessment_status === "additional_assessment" ? "Review Required" : cleaner.skills_exam_passed ? "Passed" : cleaner.skills_exam_completed_at ? "Review Required" : "Not Taken",
    Assessment_Score: cleaner.skills_exam_score,
    Government_ID_Status: recruitDocumentStatus(cleaner.id_document_status, cleaner.id_document_url),
    UTR_Status: recruitDocumentStatus(cleaner.utr_document_status, cleaner.utr_document_url),
    DBS_Status: recruitDocumentStatus(cleaner.dbs_document_status, cleaner.dbs_document_url),
    Insurance_Status: recruitDocumentStatus(insuranceExpired ? "expired" : cleaner.insurance_status, cleaner.insurance_certificate_url),
    Insurance_Expiry: isIsoDate(cleaner.insurance_expiry_date) ? cleaner.insurance_expiry_date : null,
    Photograph_Status: recruitDocumentStatus(cleaner.headshot_status, cleaner.headshot_url),
    Onboarding_Call_Status: cleaner.interview_status === "completed" ? "Completed" : cleaner.interview_status === "failed" ? "Review Required" : cleaner.interview_scheduled_at ? "Scheduled" : "Not Scheduled",
    Onboarding_Call_At: dateTime(cleaner.interview_scheduled_at),
    Secure_Cleaner_Record: `https://www.mundoria.co.uk/admin/cleaners/${encodeURIComponent(cleaner.id)}`,
    // Deliberately absent: lifecycle, activation, completion, RTW, address and other-document reviews.
    // These require Operations evidence; onboarding_complete is only form submission.
  };
}

export function incompleteActivationRequirements(cleaner: Partial<CleanerProfile>, today = new Date().toISOString().slice(0, 10)) {
  const missing: string[] = [];
  if (cleaner.interview_status !== "completed") missing.push("completed onboarding call");
  if (!cleaner.skills_exam_passed) missing.push("passed skills assessment");
  if (!cleaner.utr_number?.trim()) missing.push("UTR number");
  const docs = [
    ["profile photograph", cleaner.headshot_status, cleaner.headshot_url],
    ["Government ID", cleaner.id_document_status, cleaner.id_document_url],
    ["DBS certificate", cleaner.dbs_document_status, cleaner.dbs_document_url],
    ["UTR evidence", cleaner.utr_document_status, cleaner.utr_document_url],
    ["public liability insurance", cleaner.insurance_status, cleaner.insurance_certificate_url],
  ] as const;
  for (const [label, status, path] of docs) {
    if (recruitDocumentStatus(status, path) !== "Approved") missing.push(`uploaded and approved ${label}`);
  }
  if (!isIsoDate(cleaner.insurance_expiry_date) || cleaner.insurance_expiry_date < today) missing.push("current insurance expiry date");
  if (cleaner.specialist_review_required || cleaner.skills_assessment_status === "additional_assessment") missing.push("Operations skills review");
  return missing;
}
