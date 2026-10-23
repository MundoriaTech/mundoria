/** Cleaner onboarding compliance content + helpers (UTR, DBS, insurance, etc.). */

export const MIN_PUBLIC_LIABILITY_COVER = "1m" as const;

/**
 * Product lock: cleaners must arrange their own Public Liability cover.
 * Mundoria does not currently extend platform PL to individual cleaners.
 */
export const INSURANCE_COVER_MODEL = "cleaner_provided" as const;

export const INSURANCE_COVER_MODEL_COPY =
  "Mundoria requires you to arrange your own Public Liability Insurance (minimum £1 million for standard domestic cleaning). Mundoria does not currently provide this cover for cleaners.";

/** Minimum upload size before we flag a document as possibly unreadable. */
export const MIN_PROOF_BYTES = 8 * 1024; // 8 KB — tiny files are usually blank/corrupt

export type DocumentQualityAssessment = {
  ok: boolean;
  reason?: "too_small" | "empty";
};

/** Best-effort heuristics only — not OCR. Flags uploads for human review. */
export function assessDocumentFile(file: File): DocumentQualityAssessment {
  if (!file || file.size <= 0) return { ok: false, reason: "empty" };
  if (file.size < MIN_PROOF_BYTES) return { ok: false, reason: "too_small" };
  return { ok: true };
}

export function reasonSuggestsUnreadableDoc(reason: string) {
  return /\b(unreadable|illegible|blurry|blurred|can't read|cannot read|poor quality|not clear|unclear|too dark|cut off)\b/i.test(
    reason,
  );
}

export function mergeVerificationFlags(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
) {
  return { ...(existing && typeof existing === "object" ? existing : {}), ...patch };
}

export type UtrPath = "have" | "none" | "unsure" | "waiting";
export type DbsPath = "have" | "apply" | "waiting";
export type InsurancePath = "have" | "none" | "unsure";

export type AgreementAcceptance = {
  accepted_at: string;
  key: string;
  version: string;
};

export const CLEANER_AGREEMENT_DOCS = [
  {
    description:
      "Working relationship, bookings, payments, cancellations and account rules.",
    href: "/legal/cleaner-agreement",
    key: "cleaner_agreement",
    label: "Self-Employed Cleaner Agreement",
    version: "cleaner-agreement-v1",
  },
  {
    description:
      "Professionalism, punctuality, confidentiality, safety and incident reporting.",
    href: "/legal/cleaner-standards",
    key: "cleaner_standards",
    label: "Cleaner Standards & Code of Conduct",
    version: "cleaner-standards-v1",
  },
  {
    description: "How Mundoria collects, uses and protects your personal data.",
    href: "/privacy",
    key: "privacy_notice",
    label: "Privacy Notice",
    version: "privacy-notice-v1",
  },
  {
    description:
      "How bookings are offered, earnings calculated, and cancellations handled.",
    href: "/legal/booking-payment-policy",
    key: "booking_payment_policy",
    label: "Booking & Payment Policy",
    version: "booking-payment-policy-v1",
  },
] as const;

export const UTR_FAQS = [
  {
    a: "A UTR is a 10-digit number issued by HMRC to identify your tax records. It’s different from your National Insurance number.",
    q: "What is a UTR number?",
  },
  {
    a: "Register for Self Assessment through HMRC. If you’re starting as a sole trader, use HMRC’s sole trader registration service.",
    q: "How do I get a UTR?",
  },
  {
    a: "HMRC normally sends it by post around 15 days after registration. It may take longer in some cases.",
    q: "How long does it take to receive a UTR?",
  },
  {
    a: "Yes, if it’s your personal Self Assessment UTR. Make sure HMRC has your current self-employment information.",
    q: "I already have a UTR from another job. Can I use it?",
  },
  {
    a: "You can begin onboarding and finish other sections. Mundoria still needs tax registration verification before activating your cleaner profile.",
    q: "Can I join Mundoria without a UTR?",
  },
  {
    a: "No. Your National Insurance number and UTR serve different purposes.",
    q: "Can I use my National Insurance number instead?",
  },
  {
    a: "Under Mundoria’s self-employed cleaner arrangement, you’re generally responsible for your own taxes and Self Assessment, subject to your actual status and the law.",
    q: "Will Mundoria pay my taxes for me?",
  },
  {
    a: "Your UTR and supporting documents are handled securely and used for verification and compliance only.",
    q: "Is my UTR information safe?",
  },
] as const;

export const DBS_FAQS = [
  {
    a: "It costs £20 when you apply directly through GOV.UK.",
    q: "How much does a Basic DBS check cost?",
  },
  {
    a: "Applications are often processed within a few days, but some take longer. Your paper certificate is sent by post.",
    q: "How long does it take?",
  },
  {
    a: "Yes. Upload your certificate and Mundoria will review it.",
    q: "Can I use an existing Basic DBS certificate?",
  },
  {
    a: "Yes, but you’ll need to complete DBS verification before your cleaner profile can be fully activated.",
    q: "Can I complete onboarding without my certificate?",
  },
] as const;

export const INSURANCE_FAQS = [
  {
    a: "It can help cover certain legal costs and compensation if your work causes injury or property damage, subject to the policy terms.",
    q: "What is Public Liability Insurance?",
  },
  {
    a: "It isn’t generally a legal requirement for self-employed domestic cleaners in the UK. Mundoria can require it before you accept bookings.",
    q: "Is Public Liability Insurance compulsory?",
  },
  {
    a: "Price depends on insurer, cover level and risk. Compare quotes for suitable protection.",
    q: "How much does it cost?",
  },
  {
    a: "Yes, if the policy covers your cleaning work and meets Mundoria’s requirements (minimum £1 million Public Liability for standard domestic cleaning).",
    q: "Can I use insurance I already have?",
  },
  {
    a: "Public Liability can help if you accidentally damage a customer’s belongings while working, subject to your policy wording, exclusions and excess. It is not a guarantee for every claim — always read your certificate.",
    q: "Does PL cover broken belongings?",
  },
  {
    a: "Yes. You can finish other sections while arranging cover, but Mundoria must verify insurance before activation.",
    q: "Can I continue onboarding without insurance?",
  },
] as const;

export const EXPERIENCE_FAQS = [
  {
    a: "Optional but useful. Certificates (for example COSHH awareness) help us verify readiness.",
    q: "Do I need training certificates?",
  },
] as const;

export const LOCATION_FAQS = [
  {
    a: "Your home district plus working radius is the main match signal. Extra districts are optional for areas you cover beyond that circle.",
    q: "How does coverage matching work?",
  },
  {
    a: "A full starting postcode (for example B15 2TT) helps place your home base accurately on the map. Your district still defines the SEO/area label.",
    q: "Why ask for a starting postcode?",
  },
  {
    a: "Choose a radius you’ll reliably travel, up to 15 miles from your home base. Jobs outside that circle won’t be offered.",
    q: "How far should my radius be?",
  },
] as const;

export const EQUIPMENT_FAQS = [
  {
    a: "Some bookings need you to bring kit; others provide supplies. Tell us what you have so we can match fairly.",
    q: "Do I need my own equipment?",
  },
  {
    a: "Products (sprays, liquids) and equipment (vacuum, mop) are tracked separately because bookings often specify one or both.",
    q: "Why separate products and equipment?",
  },
  {
    a: "You can update kit later from your profile. Mundoria may mark “equipment update required” if details look incomplete.",
    q: "Can I change this later?",
  },
] as const;

export const PAYOUT_FAQS = [
  {
    a: "Your earnings will be paid according to Mundoria's payment schedule, which is set out in your cleaner agreement. Choose weekly or monthly as your preference — exact timing also depends on Stripe once your account is active.",
    q: "When will I get paid?",
  },
  {
    a: "Yes, provided it is eligible for receiving your self-employed earnings and meets Stripe's verification requirements. Bank details are entered in Stripe Connect, not in the Mundoria form.",
    q: "Can I use my personal bank account?",
  },
  {
    a: "Not necessarily. Many sole traders use personal accounts, although individual banks may have restrictions on business transactions. Stripe will guide you if a business account is needed.",
    q: "Do I need a business bank account?",
  },
  {
    a: "Yes. You can update your bank details securely through Stripe (from your cleaner dashboard). Additional verification may be required.",
    q: "Can I change my bank details later?",
  },
  {
    a: "Your payment may be delayed or unsuccessful. Check your details carefully in Stripe and update them as soon as you notice an error.",
    q: "What happens if I enter incorrect bank details?",
  },
  {
    a: "No. Your banking information is never displayed to customers. It stays with Stripe for payouts only.",
    q: "Will customers see my bank details?",
  },
  {
    a: "Under Mundoria's self-employed cleaner model, you're generally responsible for managing your own tax obligations, subject to applicable law and your actual working status.",
    q: "Does Mundoria deduct tax from my earnings?",
  },
  {
    a: "Yes. You can view your completed bookings, earnings and payment history in your cleaner dashboard. Stripe also emails payout confirmations.",
    q: "Will I receive a record of my earnings?",
  },
  {
    a: "Any applicable platform fees, deductions or adjustments are explained in your cleaner agreement before you accept bookings.",
    q: "Will I be charged any fees?",
  },
] as const;

export const FINAL_REVIEW_FAQS = [
  {
    a: "Approval times depend on how quickly we can verify your information and documents. We'll update your application status as it progresses.",
    q: "How long does approval take?",
  },
  {
    a: "Yes. You can update your details, although some changes may require additional verification.",
    q: "Can I edit my information after submitting?",
  },
  {
    a: "We'll explain the decision where appropriate and let you know whether you can provide additional information or request a review.",
    q: "What happens if my application is rejected?",
  },
  {
    a: "No. Your account must be activated before you can accept Mundoria bookings.",
    q: "Can I start accepting bookings before approval?",
  },
  {
    a: "No. Booking opportunities depend on customer demand, your availability, location, approved services and other matching criteria.",
    q: "Am I guaranteed cleaning jobs once approved?",
  },
  {
    a: "You can request to close your account, subject to any outstanding bookings, payments and applicable agreement terms.",
    q: "Can I stop using Mundoria whenever I want?",
  },
] as const;

export const EMERGENCY_FAQS = [
  {
    a: "So we can contact someone you trust if an emergency occurs while you're carrying out a Mundoria booking.",
    q: "Why does Mundoria need my emergency contact?",
  },
  {
    a: "No. Mundoria will not routinely share your bookings or work schedule with your emergency contact.",
    q: "Will my emergency contact receive messages about my bookings?",
  },
  {
    a: "Yes. You can update their information in your cleaner account.",
    q: "Can I change my emergency contact later?",
  },
  {
    a: "No. This information is for authorised Mundoria personnel only.",
    q: "Will customers see my emergency contact details?",
  },
  {
    a: "Stop working if necessary to protect your safety, move somewhere safe and contact Mundoria. If there is immediate danger, contact emergency services.",
    q: "What happens if I feel unsafe during a booking?",
  },
  {
    a: "Report the incident to Mundoria promptly, provide an accurate description and follow the incident-reporting process.",
    q: "What should I do if I accidentally damage something?",
  },
  {
    a: "Notify Mundoria as soon as possible so that appropriate arrangements can be made with the customer.",
    q: "What if I become unwell and cannot complete a booking?",
  },
  {
    a: "Mundoria can help coordinate booking-related incidents and support. It does not replace emergency services or professional medical assistance.",
    q: "Does Mundoria provide emergency assistance?",
  },
] as const;

export const TRAINING_OPTIONS = [
  "COSHH awareness",
  "Manual handling",
  "Infection control / hygiene",
  "Working at height (basic)",
  "First aid awareness",
  "Customer service / professional cleaning course",
] as const;

/** Preferred weekly volume (guides matching — not a hard cap). */
export const PREFERRED_HOURS_BANDS = [
  { label: "Up to 10 hours a week", value: "up_to_10" },
  { label: "10–20 hours a week", value: "10_20" },
  { label: "20–30 hours a week", value: "20_30" },
  { label: "30+ hours a week", value: "30_plus" },
  { label: "Flexible", value: "flexible" },
] as const;

export const UTR_PROOF_TYPES = [
  "HMRC confirmation letter or welcome letter",
  "Screenshot from HMRC Personal Tax Account or app",
  "Self Assessment tax return showing your UTR",
  "Other HMRC correspondence that shows your name and UTR",
] as const;

export const SAFETY_GUIDELINES = [
  "Check booking details, address and access notes before you travel.",
  "Only use products and equipment you understand — follow labels and PPE guidance.",
  "If a property feels unsafe, leave and contact Mundoria support immediately.",
  "Do not confront anyone about theft, aggression or disputes — prioritise your safety.",
  "Report accidents, near-misses, injuries and property damage to Mundoria promptly.",
  "In a life-threatening emergency dial 999. For non-emergencies you can also use 101.",
  "Keep emergency contact details up to date in your Mundoria profile.",
] as const;

export const EMERGENCY_COUNTRIES = [
  "United Kingdom",
  "Ireland",
  "France",
  "Spain",
  "Portugal",
  "Poland",
  "Romania",
  "Italy",
  "Germany",
  "Other",
] as const;

export const INCIDENT_CATEGORIES = [
  { label: "Injury or illness", value: "injury" },
  { label: "Property damage", value: "property_damage" },
  { label: "Unsafe condition", value: "unsafe_condition" },
  { label: "Theft or missing items", value: "theft" },
  { label: "Customer behaviour", value: "customer_behaviour" },
  { label: "Other", value: "other" },
] as const;

export const EQUIPMENT_ITEMS = [
  "Vacuum cleaner",
  "Mop and bucket",
  "Microfibre cloths",
  "Cleaning brushes",
  "Broom and dustpan",
  "Dusters",
  "Squeegee / window-cleaning tools",
] as const;

export const PRODUCT_ITEMS = [
  "Multi-purpose cleaner",
  "Bathroom cleaner",
  "Toilet cleaner",
  "Kitchen degreaser",
  "Glass cleaner",
  "Floor cleaner",
  "Disinfectant",
  "Descaler",
  "Oven cleaner",
] as const;

export const PPE_ITEMS = [
  "Protective gloves",
  "Non-slip footwear",
  "Protective apron",
  "Eye protection",
] as const;

export const HMRC_REGISTER_URL =
  "https://www.gov.uk/become-sole-trader/register-sole-trader";
export const HMRC_FIND_UTR_URL = "https://www.gov.uk/find-utr-number";
export const DBS_APPLY_URL = "https://www.gov.uk/request-copy-criminal-record";

export const INSURANCE_COVER_PRESETS = ["1m", "2m", "5m"] as const;
export const TRANSPORT_MODE_PRESETS = [
  "car",
  "public",
  "bike",
  "walk",
] as const;

export const TRANSPORT_MODE_OPTIONS = [
  { label: "I drive and have my own car", value: "car" },
  { label: "Public transport", value: "public" },
  { label: "Bicycle", value: "bike" },
  { label: "Walking", value: "walk" },
  { label: "Other", value: "other" },
] as const;

export function digitsOnly(value: string, max = 10) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function isValidUtr(value: string) {
  return /^\d{10}$/.test(digitsOnly(value));
}

/** Parse a cover amount string into pounds (supports 1m / £1.5 million / 1500000). */
export function parseCoverPounds(value: string): number | null {
  const raw = value.trim().toLowerCase().replace(/,/g, "").replace(/£/g, "");
  if (!raw || raw === "other") return null;
  if (raw === "1m") return 1_000_000;
  if (raw === "2m") return 2_000_000;
  if (raw === "5m") return 5_000_000;

  const millionMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(m|million)\b/);
  if (millionMatch) {
    const amount = Number(millionMatch[1]);
    return Number.isFinite(amount) ? amount * 1_000_000 : null;
  }

  const numeric = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  // Treat bare small numbers like "1.5" as millions when under 1000.
  if (numeric < 1000) return numeric * 1_000_000;
  return numeric;
}

export function isAcceptableInsuranceCover(value: string) {
  if (
    (INSURANCE_COVER_PRESETS as readonly string[]).includes(value.trim())
  ) {
    return true;
  }
  const pounds = parseCoverPounds(value);
  return pounds != null && pounds >= 1_000_000;
}

export function insuranceCoverBand(value: string) {
  const trimmed = value.trim();
  if ((INSURANCE_COVER_PRESETS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  if (trimmed) return "other";
  return null;
}

export function insuranceCoverOtherText(value: string) {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed === "other" ||
    (INSURANCE_COVER_PRESETS as readonly string[]).includes(trimmed)
  ) {
    return "";
  }
  return trimmed;
}

export function transportModeBand(value: string) {
  const { modes } = parseTransportModes(value);
  if (modes.length === 1) return modes[0] ?? null;
  if (modes.length > 1) return modes.includes("other") ? "other" : modes[0]!;
  return null;
}

export function transportModeOtherText(value: string) {
  return parseTransportModes(value).otherText;
}

/** Parse stored transport_mode (single legacy value or comma-separated multi). */
export function parseTransportModes(value: string): {
  modes: string[];
  otherText: string;
} {
  const trimmed = value.trim();
  if (!trimmed) return { modes: [], otherText: "" };

  if ((TRANSPORT_MODE_PRESETS as readonly string[]).includes(trimmed)) {
    return { modes: [trimmed], otherText: "" };
  }
  if (trimmed === "other") return { modes: ["other"], otherText: "" };
  if (trimmed.startsWith("other:")) {
    return { modes: ["other"], otherText: trimmed.slice(6).trim() };
  }
  if (!trimmed.includes(",")) {
    return { modes: ["other"], otherText: trimmed };
  }

  const modes: string[] = [];
  let otherText = "";
  for (const part of trimmed.split(",").map((item) => item.trim()).filter(Boolean)) {
    if (part.startsWith("other:")) {
      modes.push("other");
      otherText = part.slice(6).trim();
      continue;
    }
    if (part === "other") {
      modes.push("other");
      continue;
    }
    if ((TRANSPORT_MODE_PRESETS as readonly string[]).includes(part)) {
      modes.push(part);
      continue;
    }
    modes.push("other");
    otherText = otherText ? `${otherText}, ${part}` : part;
  }
  return { modes: Array.from(new Set(modes)), otherText };
}

export function serializeTransportModes(
  modes: string[],
  otherText: string,
): string {
  const unique = Array.from(new Set(modes.filter(Boolean)));
  const parts: string[] = [];
  for (const mode of unique) {
    if (mode === "other") {
      const text = otherText.trim();
      parts.push(text ? `other:${text}` : "other");
      continue;
    }
    if ((TRANSPORT_MODE_PRESETS as readonly string[]).includes(mode)) {
      parts.push(mode);
    }
  }
  return parts.join(",");
}

export function isPastDateIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T00:00:00`);
  return date < today;
}

export function toggleListItem(list: string[], item: string) {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

/**
 * Cleaner-facing application lifecycle label (pack §9 statuses),
 * mapped onto the existing cleaner profile fields.
 */
export function applicationLifecycleLabel(cleaner: {
  interview_status?: string | null;
  onboarding_complete?: boolean | null;
  status?: string | null;
  utr_document_status?: string | null;
  dbs_document_status?: string | null;
  insurance_status?: string | null;
  id_document_status?: string | null;
}) {
  if (!cleaner.onboarding_complete) return "Draft";
  if (cleaner.status === "suspended") return "Suspended";
  if (cleaner.status === "removed") return "Rejected";
  if (cleaner.status === "active") return "Active";
  if (cleaner.status === "certified") return "Approved";

  const docsNeedAction = [
    cleaner.utr_document_status,
    cleaner.dbs_document_status,
    cleaner.insurance_status,
    cleaner.id_document_status,
  ].some((status) => status === "rejected" || status === "expired");

  if (
    docsNeedAction ||
    cleaner.interview_status === "failed" ||
    cleaner.status === "in_training"
  ) {
    return "Action Required";
  }

  if (
    cleaner.interview_status === "awaiting" ||
    cleaner.status === "pending"
  ) {
    return "Under Review";
  }

  return "Submitted";
}

/** Maps stored review status + branch path onto pack lifecycle labels. */
export function verificationLifecycleLabel(
  status: string | null | undefined,
  path?: string | null,
  options?: { kind?: "utr" | "dbs" | "insurance" | "equipment" },
) {
  if (status === "verified") return "Verified";
  if (status === "expired") return "Expired";
  if (status === "rejected") return "Action required";
  if (status === "pending") return "Submitted";
  if (options?.kind === "dbs" && (path === "waiting" || path === "apply")) {
    return "Awaiting DBS";
  }
  if (options?.kind === "equipment" && status === "update_required") {
    return "Equipment update required";
  }
  if (
    path === "waiting" ||
    path === "apply" ||
    path === "none" ||
    path === "unsure"
  ) {
    return "Awaiting applicant";
  }
  if (!status || status === "missing") return "Not started";
  return "Missing";
}

export function namesLikelyMatch(a: string, b: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return true;
  if (left === right) return true;
  const leftParts = left.split(" ");
  const rightParts = right.split(" ");
  const shared = leftParts.filter((part) => rightParts.includes(part));
  return shared.length >= Math.min(2, leftParts.length, rightParts.length);
}

export function generateApplicationReference(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MDR-${stamp}-${suffix}`;
}

export function isValidUkPostcodeLoose(value: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!cleaned) return false;
  const compact = cleaned.replace(/\s/g, "");
  return (
    /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(compact) ||
    /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(compact)
  );
}

/** Soft UK postcode format: outward only or full. */
export function formatUkPostcodeDisplay(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  if (compact.length > 5) {
    return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
  }
  return compact;
}
