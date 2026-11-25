export type RightToWorkRoute = "british_irish" | "share_code";

/** GOV.UK service an admin uses to check a share code with the date of birth. */
export const RIGHT_TO_WORK_CHECK_URL = "https://www.gov.uk/view-right-to-work";
/** Where a cleaner gets a share code. */
export const RIGHT_TO_WORK_SHARE_CODE_URL = "https://www.gov.uk/prove-right-to-work";

export const RIGHT_TO_WORK_ROUTE_LABELS: Record<RightToWorkRoute, string> = {
  british_irish: "British or Irish citizen",
  share_code: "Share code (visa, eVisa or EU Settlement)",
};

/**
 * Immigration status for share-code holders. Mundoria cleaners are
 * self-employed; `selfEmploymentRestricted` marks visas whose conditions
 * usually don't allow self-employment, so an admin checks the GOV.UK result
 * closely before approving.
 */
export const VISA_TYPES = [
  { label: "EU Settlement Scheme: settled status", value: "eu_settled" },
  { label: "EU Settlement Scheme: pre-settled status", value: "eu_pre_settled" },
  { label: "Indefinite leave to remain", value: "indefinite_leave" },
  { label: "Family visa (spouse, partner or parent)", value: "family" },
  { label: "Refugee or humanitarian protection", value: "refugee" },
  { label: "Ukraine scheme", value: "ukraine" },
  { label: "British National (Overseas) visa", value: "bno" },
  { label: "Graduate visa", value: "graduate" },
  { label: "Dependant visa", value: "dependant" },
  { label: "Skilled Worker visa", selfEmploymentRestricted: true, value: "skilled_worker" },
  { label: "Health and Care Worker visa", selfEmploymentRestricted: true, value: "health_care_worker" },
  { label: "Student visa", selfEmploymentRestricted: true, value: "student" },
  { label: "Other", value: "other" },
] as const;

export type VisaType = (typeof VISA_TYPES)[number]["value"];

export function visaTypeLabel(value: string | null | undefined) {
  return VISA_TYPES.find((type) => type.value === value)?.label ?? null;
}

export function visaRestrictsSelfEmployment(value: string | null | undefined) {
  const type = VISA_TYPES.find((item) => item.value === value);
  return Boolean(type && "selfEmploymentRestricted" in type && type.selfEmploymentRestricted);
}

/** "w12 345 678" → "W12345678" */
export function normaliseShareCode(value: string | null | undefined) {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "W12345678" → "W12 345 678" for display. */
export function formatShareCode(value: string | null | undefined) {
  const code = normaliseShareCode(value);
  return code.length === 9
    ? `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}`
    : code;
}

export function isValidShareCode(value: string | null | undefined) {
  return /^[A-Z0-9]{9}$/.test(normaliseShareCode(value));
}

/** Cleaners must be at least 18. */
export function isAdultDateOfBirth(value: string | null | undefined, now = new Date()) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const eighteenth = new Date(Date.UTC(y + 18, m - 1, d));
  return eighteenth.getTime() <= now.getTime() && y > 1900;
}

/** Problem with the right-to-work answers, or null when complete. */
export function rightToWorkIssue(input: {
  date_of_birth: string;
  right_to_work_expires_on: string;
  right_to_work_route: RightToWorkRoute | null | "";
  right_to_work_share_code: string;
  right_to_work_visa_type?: string | null;
}) {
  if (!input.right_to_work_route) {
    return "Choose how you can prove your right to work in the UK.";
  }
  if (!input.date_of_birth) return "Enter your date of birth.";
  if (!isAdultDateOfBirth(input.date_of_birth)) {
    return "You need to be at least 18 to work with Mundoria.";
  }
  if (input.right_to_work_route === "share_code") {
    if (!VISA_TYPES.some((type) => type.value === input.right_to_work_visa_type)) {
      return "Choose your visa or immigration status.";
    }
    if (!isValidShareCode(input.right_to_work_share_code)) {
      return "Enter your 9-character share code (it usually starts with W).";
    }
    if (
      input.right_to_work_expires_on &&
      input.right_to_work_expires_on <= new Date().toISOString().slice(0, 10)
    ) {
      return "Your permission end date has passed. Get a new share code from GOV.UK.";
    }
  }
  return null;
}
