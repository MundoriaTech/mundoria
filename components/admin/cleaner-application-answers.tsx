import { Chips, DetailSection } from "@/components/admin/detail-section";
import { coverAmount, humanize, ukDate, ukDateTime, yesNo } from "@/lib/admin/format";
import {
  CLEANER_AGREEMENT_DOCS,
  PREFERRED_HOURS_BANDS,
  TRANSPORT_MODE_OPTIONS,
  parseTransportModes,
  type AgreementAcceptance,
} from "@/lib/cleaner/onboarding-compliance";
import {
  SKILLS_EXAM_QUESTIONS,
  answerIsCorrect,
  type SkillsExamAnswer,
} from "@/lib/cleaner/skills-exam";
import { formatServiceName } from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";

type Row = Record<string, unknown>;

export type AvailabilityRow = {
  day_of_week: number;
  end_time: string;
  is_available: boolean;
  start_time: string;
};

export type WorkingAreaRow = {
  latitude: number | null;
  longitude: number | null;
  postcode_prefix: string | null;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Show the working week first.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function hhmm(value: string) {
  return value.slice(0, 5);
}

function withOther(items: string[], other: unknown) {
  const extra = text(other);
  return items.map((item) => (item.toLowerCase() === "other" && extra ? `Other: ${extra}` : item));
}

function transportLabel(value: unknown) {
  const raw = text(value);
  if (!raw) return [];
  const { modes, otherText } = parseTransportModes(raw);
  return modes.map((mode) => {
    if (mode === "other") return otherText ? `Other: ${otherText}` : "Other";
    return TRANSPORT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? humanize(mode);
  });
}

/**
 * Everything the applicant answered in the onboarding wizard that the
 * checks/documents block does not already show, laid out in wizard order.
 */
export function CleanerApplicationAnswers({
  areas,
  availability,
  cleaner,
  services,
  signupMarketingOptIn,
}: {
  areas: WorkingAreaRow[];
  availability: AvailabilityRow[];
  cleaner: Row;
  services: Array<{ is_active: boolean; service_type: string }>;
  signupMarketingOptIn: boolean | null;
}) {
  const home = areas.find((area) => area.latitude !== null && area.longitude !== null);
  const radiusKm = typeof cleaner.working_radius_km === "number" ? cleaner.working_radius_km : null;
  const emergency = (cleaner.emergency_contact ?? {}) as Row;
  const relationship = text(emergency.relationship) === "other"
    ? `Other: ${text(emergency.relationship_other) ?? "not described"}`
    : humanize(text(emergency.relationship));
  const agreements = (Array.isArray(cleaner.agreement_acceptances) ? cleaner.agreement_acceptances : []) as AgreementAcceptance[];
  const answers = (cleaner.skills_exam_answers ?? null) as Record<string, SkillsExamAnswer> | null;
  const wrong = answers
    ? SKILLS_EXAM_QUESTIONS.filter((question) => !answerIsCorrect(question, answers[question.id]))
    : [];
  const hoursBand = PREFERRED_HOURS_BANDS.find((band) => band.value === cleaner.preferred_hours_band)?.label
    ?? humanize(text(cleaner.preferred_hours_band));
  const insuredName = text(cleaner.insurance_insured_name);
  const nameMismatch = Boolean((cleaner.verification_flags as Row | null)?.name_mismatch);

  const availabilityByDay = DAY_ORDER.map((day) => {
    const windows = availability
      .filter((row) => row.day_of_week === day && row.is_available)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((row) => `${hhmm(row.start_time)}–${hhmm(row.end_time)}`);
    return { label: DAYS[day]!, value: windows.length ? windows.join(", ") : "Not available" };
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <DetailSection
        description="What the applicant told us in the onboarding wizard."
        rows={[
          { label: "Submitted", value: ukDateTime(cleaner.info_accuracy_confirmed_at as string | null) },
          { label: "Signed up", value: ukDateTime(cleaner.created_at as string | null) },
          { label: "Years of experience", value: cleaner.years_experience === null || cleaner.years_experience === undefined ? null : String(cleaner.years_experience) },
          { label: "Experience band", value: humanize(text(cleaner.experience_band)) },
          { label: "Payout preference", value: humanize(text(cleaner.payout_preference)) },
          {
            label: "Skills exam",
            value: cleaner.skills_exam_score === null || cleaner.skills_exam_score === undefined
              ? null
              : `${cleaner.skills_exam_score}/${SKILLS_EXAM_QUESTIONS.length}${cleaner.skills_exam_completed_at ? ` · ${ukDateTime(cleaner.skills_exam_completed_at as string)}` : ""}`,
          },
          {
            label: "Questions answered wrongly",
            value: answers
              ? wrong.length
                ? wrong.map((question) => `• ${question.prompt}`).join("\n")
                : "None"
              : "Not recorded (applied before answers were saved)",
            wide: true,
          },
        ]}
        title="Application answers"
      />

      <DetailSection
        rows={[
          {
            label: "Services offered",
            value: (
              <Chips
                items={services
                  .filter((service) => service.is_active)
                  .map((service) => formatServiceName(service.service_type as ServiceType))}
              />
            ),
            wide: true,
          },
          { label: "Preferred weekly hours", value: hoursBand },
          ...availabilityByDay,
        ]}
        title="Services & availability"
      />

      <DetailSection
        rows={[
          { label: "Home district", value: home?.postcode_prefix ?? null },
          {
            label: "Travel radius",
            value: radiusKm ? `${Math.round(radiusKm / 1.609344)} miles (${radiusKm} km)` : null,
          },
          {
            label: "Areas covered",
            value: <Chips items={areas.map((area) => area.postcode_prefix ?? "").filter(Boolean)} />,
            wide: true,
          },
          { label: "Gets around by", value: <Chips items={transportLabel(cleaner.transport_mode)} /> },
          { label: "Can carry equipment to jobs", value: yesNo(text(cleaner.can_transport_equipment)) },
        ]}
        title="Coverage & travel"
      />

      <DetailSection
        rows={[
          { label: "Equipment", value: humanize(text(cleaner.equipment_ownership)) },
          { label: "Equipment they own", value: <Chips items={withOther(list(cleaner.equipment_owned), cleaner.equipment_other)} />, wide: true },
          { label: "Products", value: humanize(text(cleaner.products_ownership)) },
          { label: "Products they own", value: <Chips items={withOther(list(cleaner.products_owned), cleaner.products_other)} />, wide: true },
        ]}
        title="Equipment & products"
      />

      <DetailSection
        description="Answers that sit alongside the documents above."
        rows={[
          { label: "UTR route", value: humanize(text(cleaner.utr_path)) },
          { label: "DBS route", value: humanize(text(cleaner.dbs_path)) },
          { label: "DBS certificate issued", value: ukDate(cleaner.dbs_issued_on as string | null) },
          { label: "Insurance route", value: humanize(text(cleaner.insurance_path)) },
          { label: "Insurance policy number", value: text(cleaner.insurance_policy_number) },
          {
            label: "Name on the insurance",
            value: insuredName
              ? `${insuredName}${nameMismatch ? " ⚠ differs from the account name" : ""}`
              : null,
          },
          { label: "Insurance cover", value: coverAmount(cleaner.insurance_cover_amount as string | null) },
          { label: "Insurance expires", value: ukDate(cleaner.insurance_expiry_date as string | null) },
          { label: "Covers cleaning work (confirmed)", value: yesNo(cleaner.insurance_activity_confirmed as boolean | null) },
          { label: "Date of birth", value: ukDate(cleaner.date_of_birth as string | null) },
        ]}
        title="Compliance answers"
      />

      <DetailSection
        rows={[
          { label: "Name", value: text(emergency.name) },
          { label: "Relationship", value: relationship },
          { label: "Mobile", value: text(emergency.mobile) },
          { label: "Other phone", value: text(emergency.alt_phone) },
          { label: "Email", value: text(emergency.email) },
          { label: "Country", value: text(emergency.country) },
          { label: "Contact knows they're listed", value: yesNo(emergency.informed as boolean | null) },
        ]}
        title="Emergency contact"
      />

      <DetailSection
        rows={[
          ...CLEANER_AGREEMENT_DOCS.map((doc) => {
            const accepted = agreements.find((item) => item.key === doc.key);
            return {
              label: doc.label,
              value: accepted ? `Accepted ${ukDateTime(accepted.accepted_at)} (${accepted.version})` : "Not accepted",
            };
          }),
          ...agreements
            .filter((item) => !CLEANER_AGREEMENT_DOCS.some((doc) => doc.key === item.key))
            .map((item) => ({ label: humanize(item.key), value: `Accepted ${ukDateTime(item.accepted_at)} (${item.version})` })),
          { label: "Safety guidance acknowledged", value: ukDateTime(cleaner.safety_acknowledged_at as string | null) },
          {
            label: "Location sharing on jobs",
            value: cleaner.location_tracking_consent_at
              ? `Agreed ${ukDateTime(cleaner.location_tracking_consent_at as string)}${cleaner.location_tracking_consent_version ? ` (${cleaner.location_tracking_consent_version})` : ""}`
              : null,
          },
          { label: "Information confirmed accurate", value: ukDateTime(cleaner.info_accuracy_confirmed_at as string | null) },
          { label: "Marketing emails (sign-up)", value: signupMarketingOptIn === null ? "Not asked" : yesNo(signupMarketingOptIn) },
          {
            label: "Marketing emails (application)",
            value: cleaner.marketing_consent_at ? `Yes, ${ukDateTime(cleaner.marketing_consent_at as string)}` : "No",
          },
        ]}
        title="Agreements & consents"
      />
    </div>
  );
}
