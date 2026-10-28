"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Minus,
  Monitor,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { slideStep, SPRING } from "@/lib/motion";

import { FormField } from "@/components/auth/form-field";
import {
  AuthPhoneField,
  UkFlag,
} from "@/components/auth/auth-phone-field";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import {
  ActionError,
  FieldError,
  invalidControlClass,
} from "@/components/shared/action-error";
import { AppModal } from "@/components/shared/app-modal";
import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  nationalFromPhone,
  storedPhone,
} from "@/lib/auth/uk-phone";
import {
  hasAnyDocument,
  parseDocumentList,
  parseDocumentUrls,
  removeDocumentAt,
  withDocumentAt,
  withDocumentSide,
} from "@/lib/cleaner/document-urls";
import {
  INTERVIEW_DURATION_MINUTES,
  upcomingInterviewDays,
} from "@/lib/cleaner/interview-slots";
import {
  AgreementsReviewStep,
  DbsComplianceStep,
  EmergencyContactStep,
  EquipmentComplianceStep,
  InsuranceComplianceStep,
  LocationExtras,
  UtrComplianceStep,
} from "@/components/cleaner/onboarding-compliance-steps";
import {
  ChoicePills,
  DocumentUpload,
  InfoCallout,
  OnboardingCheckbox,
} from "@/components/cleaner/onboarding-primitives";
import { TrainingSurvey } from "@/components/cleaner/training-survey";
import {
  CLEANER_AGREEMENT_DOCS,
  PREFERRED_HOURS_BANDS,
  assessDocumentFile,
  isAcceptableInsuranceCover,
  isPastDateIso,
  isValidUtr,
  mergeVerificationFlags,
  parseTransportModes,
  type DbsPath,
  type InsurancePath,
  type UtrPath,
} from "@/lib/cleaner/onboarding-compliance";
import {
  CHARTER_AGREEMENTS,
  SKILLS_EXAM_PASS_SCORE,
  SKILLS_EXAM_QUESTIONS,
  answerIsComplete,
  scoreSkillsExam,
  type SkillsExamAnswer,
} from "@/lib/cleaner/skills-exam";
import {
  categoryDefinition,
  offeredServices,
  servicesForCategory,
} from "@/lib/customer/services";
import { ownStoragePath } from "@/lib/storage/own-object";
import { uploadWithProgress } from "@/lib/storage/upload-with-progress";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  DAY_WINDOW_END_MINUTES,
  DAY_WINDOW_START_MINUTES,
} from "@/components/shared/time-slot-picker";
import {
  getGeoapifyApiKey,
  type GeoapifyAutocompleteResponse,
} from "@/lib/maps/geoapify";
import {
  birminghamPostcodesForPicker,
} from "@/lib/seo/marketing";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";
import type { ServiceCategory, ServiceType } from "@/types/customer";

const BIRMINGHAM_CENTER = { lat: 52.4862, lng: -1.8904 };
const MAX_RADIUS_MILES = 15;
const DEFAULT_RADIUS_MILES = 8;
/** Home base + extras from the districts picker. */
const MAX_WORKING_DISTRICTS = 6;
const MILES_TO_METRES = 1609.344;

const COVERAGE_SHORTCUTS = birminghamPostcodesForPicker().map((item) => ({
  label: `${item.name} · ${item.prefix}`,
  prefix: item.prefix,
}));

function ukOutwardCode(value: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!cleaned) return "";
  const spaced = cleaned.split(" ");
  if (spaced.length >= 2) return spaced[0] ?? "";
  const match = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match?.[1] ?? cleaned;
}

async function geocodeUkPostcode(text: string) {
  const apiKey = getGeoapifyApiKey();
  const query = text.trim();
  if (!apiKey || query.length < 2) return null;
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("text", `${query}, UK`);
  url.searchParams.set("filter", "countrycode:gb");
  url.searchParams.set("limit", "1");
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = (await response.json()) as GeoapifyAutocompleteResponse;
  const feature = data.features?.[0];
  if (!feature?.properties) return null;
  const lat = Number(feature.properties.lat);
  const lng = Number(feature.properties.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Same three pillars as booking and marketing (Home / Work / Recovery). */
const MAIN_SERVICE_CATEGORIES = [
  "residential",
  "commercial",
  "recovery",
] as const satisfies ReadonlyArray<ServiceCategory>;

const MAIN_CATEGORY_LABEL: Record<(typeof MAIN_SERVICE_CATEGORIES)[number], string> =
  {
    residential: "Residential",
    commercial: "Commercial",
    recovery: "Recovery",
  };

/** Moving + short-let sit under Residential for cleaners (not separate pillars). */
const RESIDENTIAL_BUCKET = new Set<ServiceCategory>([
  "residential",
  "moving_home",
  "short_term_rental",
]);

/**
 * Legacy / overlapping short-stay types — matching already aliases these to
 * airbnb_turnover, so cleaners only need the one Airbnb/Shortlet option.
 */
const SHORT_LET_DUPES = new Set<ServiceType>([
  "holiday_let",
  "serviced_accommodation",
]);

const SERVICE_CATEGORY_THEME: Record<
  (typeof MAIN_SERVICE_CATEGORIES)[number],
  { accent: string; soft: string; wash: string }
> = {
  residential: {
    accent: "#312c79",
    soft: "#f7f3ff",
    wash: "#efe8fa",
  },
  commercial: {
    accent: "#2f5f8a",
    soft: "#f2f7fb",
    wash: "#dceaf4",
  },
  recovery: {
    accent: "#9a5b6e",
    soft: "#fbf4f6",
    wash: "#f3e4e9",
  },
};

function servicesForMainCategory(
  main: (typeof MAIN_SERVICE_CATEGORIES)[number],
  selected: string[],
) {
  if (main === "residential") {
    return offeredServices().filter((service) => {
      if (!RESIDENTIAL_BUCKET.has(service.category)) return false;
      if (
        SHORT_LET_DUPES.has(service.value) &&
        !selected.includes(service.value)
      ) {
        return false;
      }
      return true;
    });
  }
  return servicesForCategory(main);
}

type DocKind = "dbs" | "id" | "headshot" | "utr" | "insurance" | "training";
type DocSlotKey =
  | "headshot"
  | "id:0"
  | "id:1"
  | `dbs:${number}`
  | "utr:0"
  | "insurance:0"
  | "training:0";

function docSlotKey(kind: DocKind, side = 0): DocSlotKey {
  if (kind === "headshot") return "headshot";
  return `${kind}:${side}` as DocSlotKey;
}

function isSingleDocKind(kind: DocKind) {
  return (
    kind === "headshot" ||
    kind === "utr" ||
    kind === "insurance" ||
    kind === "training"
  );
}

function isListDocKind(kind: DocKind) {
  return kind === "dbs" || kind === "id";
}

const MAX_ID_DOCUMENT_PAGES = 2;

function setMultiDocValue(
  kind: DocKind,
  stored: string,
  side: number,
  next: string,
) {
  if (isListDocKind(kind)) {
    return next.trim()
      ? withDocumentAt(stored, side, next)
      : removeDocumentAt(stored, side);
  }
  return withDocumentSide(stored, side === 1 ? 1 : 0, next);
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Same cream surface as the customer booking flow. */
const ONBOARDING_PAGE_BG = "bg-[#f9f6ef]";
/** Fields sit on the page colour with a stronger ink border. */
const ONBOARDING_FIELD_CLASS =
  "border-2 border-[#1c133b] bg-[#f9f6ef] focus-visible:bg-[#f9f6ef] focus-visible:ring-[#1c133b]";

/** Pack page headings in sentence case (not Title Case). Keep acronyms: UTR, DBS. */
const STEPS = [
  {
    id: "about",
    label: "Tell us about your cleaning experience",
    minutes: 2,
  },
  { id: "photo", label: "Your profile picture", minutes: 2 },
  { id: "services", label: "Your services", minutes: 2 },
  { id: "hours", label: "When would you like to work?", minutes: 3 },
  { id: "coverage", label: "Where would you like to work?", minutes: 2 },
  { id: "identity", label: "Identity & right to work", minutes: 3 },
  { id: "utr", label: "Your UTR", minutes: 3 },
  { id: "dbs", label: "Your DBS check", minutes: 3 },
  { id: "insurance", label: "Your insurance", minutes: 3 },
  {
    id: "equipment",
    label: "Your cleaning equipment & supplies",
    minutes: 3,
  },
  { id: "quiz", label: "Quiz", minutes: 5 },
  { id: "consent", label: "Location consent", minutes: 1 },
  { id: "appointment", label: "Your appointment with Mundoria", minutes: 3 },
  { id: "emergency", label: "Your emergency contact", minutes: 2 },
  { id: "agreements", label: "You're almost there!", minutes: 2 },
] as const;

// Labels used on the final review screen (sentence case; pack section names).
const SUMMARY_LABELS: Partial<Record<StepId, string>> = {
  about: "Cleaning experience",
  coverage: "Work location & availability (area)",
  dbs: "Basic DBS check",
  emergency: "Emergency contact",
  equipment: "Cleaning equipment & supplies",
  hours: "Work location & availability (hours)",
  identity: "Identity & right to work",
  photo: "Personal information & profile photo",
  utr: "UTR verification",
};

const GROUPS: { ids: StepId[]; title: string; blurb: string }[] = [
  {
    ids: ["about", "photo", "services", "hours", "coverage"],
    title: "About your work",
    blurb: "Experience, services, hours and coverage",
  },
  {
    ids: ["identity", "utr", "dbs", "insurance", "equipment", "quiz"],
    title: "Checks and readiness",
    blurb: "ID, tax, DBS, insurance, kit and training",
  },
  {
    ids: ["consent", "appointment", "emergency", "agreements"],
    title: "Finish",
    blurb: "Consent, interview, safety and agreements",
  },
];

const STEP_WHY: Record<StepId, string> = {
  about:
    "Every cleaner brings something different. Tell us about your experience so we can match you well.",
  photo: "A clear face photo helps customers recognise you on the day.",
  services: "Only select services you have the experience and confidence to carry out.",
  hours:
    "Choose the days and times you’re usually available for Mundoria bookings.",
  coverage:
    "Work where it suits you. Tell us which areas you’d like to cover so we can match suitable bookings.",
  identity: "We verify identity before any jobs go live.",
  utr: "We’ll use your UTR to verify your tax registration.",
  dbs: "To help keep customers and cleaners safe, we require a Basic DBS check as part of joining Mundoria.",
  insurance:
    "Public Liability Insurance helps protect you if someone is injured or property is damaged because of your cleaning work, subject to the policy.",
  equipment:
    "Don’t worry if you don’t have everything. We’ll use your answers to determine which bookings are suitable for you.",
  quiz: "A quick check that you know how Mundoria jobs work.",
  consent: "GPS is only used when you check in and check out of an active job.",
  appointment: "A short online chat so we can approve your account.",
  emergency:
    "Provide someone we can contact in an emergency while you’re on a Mundoria booking.",
  agreements:
    "You’ve made it to the final stage. Review your application and accept the agreements before submitting.",
};

const STEP_HEADER_ICONS: Record<StepId, string> = {
  about: "/images/marketing/icons/onboarding-mark.svg",
  photo: "/images/marketing/icons/profile-mark.svg",
  services: "/images/marketing/icons/services-mark.svg",
  hours: "/images/marketing/icons/hours-mark.svg",
  coverage: "/images/marketing/icons/coverage-mark.svg",
  identity: "/images/marketing/icons/identity-mark.svg",
  utr: "/images/marketing/icons/utr-mark.svg",
  dbs: "/images/marketing/icons/dbs-mark.svg",
  insurance: "/images/marketing/icons/dbs-mark.svg",
  equipment: "/images/marketing/icons/services-mark.svg",
  quiz: "/images/marketing/icons/quiz-mark.svg",
  consent: "/images/marketing/icons/consent-mark.svg",
  appointment: "/images/marketing/icons/appointment-mark.svg",
  emergency: "/images/marketing/icons/consent-mark.svg",
  agreements: "/images/marketing/icons/onboarding-mark.svg",
};

function guideTipGridClass(count: number) {
  return cn(
    "grid gap-3 sm:gap-4",
    count === 1 && "mx-auto max-w-sm",
    count === 2 && "sm:grid-cols-2",
    count >= 3 && "sm:grid-cols-3",
  );
}

const GUIDE_TIP_MEDIA_CLASS =
  "relative aspect-[4/3] overflow-hidden bg-[#efe8fa] sm:aspect-square";

const PHOTO_GUIDE_TIPS = [
  {
    body: "Show your face and shoulders looking at the camera — like a friendly hello.",
    crossedOut: false,
    image: "/images/marketing/onboarding/photo-tip-framing.jpg",
    title: "Face and shoulders",
  },
  {
    body: "Skip the sunglasses so customers can see you clearly.",
    crossedOut: true,
    image: "/images/marketing/onboarding/photo-tip-man-sunglasses.jpg",
    title: "No sunglasses",
    zoomFace: true,
  },
  {
    body: "One clear photo of just you — JPEG, PNG or WebP all work.",
    crossedOut: true,
    image: "/images/marketing/onboarding/photo-tip-group.jpg",
    title: "No group photos",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type FieldIssue = { field: string; message: string };

type AvailabilityDay = {
  day_of_week: number;
  end_time: string;
  is_available: boolean;
  start_time: string;
  /** Optional second range for the same day (empty = none). */
  end_time_2?: string;
  start_time_2?: string;
};

type OnboardingData = {
  accuracy_confirmed: boolean;
  cleaning_skills_other: string;
  emergency_relationship_other: string;
  equipment_other: string;
  insurance_activity_confirmed: boolean;
  insurance_insured_name: string;
  marketing_consent: boolean;
  ppe_other: string;
  preferred_hours_band: string;
  products_other: string;
  reference_company: string;
  reference_contact_ok: boolean;
  reference_email: string;
  reference_name: string;
  reference_phone: string;
  reference_relationship: string;
  specialised_other: string;
  training_certificate_url: string;
  training_completed: string[];
  training_path: string;
  interview_scheduled_at: string | null;
  availability: AvailabilityDay[];
  bio: string;
  booking_preferences: string[];
  can_transport_equipment: string;
  cleaning_skills: string[];
  dbs_certificate_number: string;
  dbs_document_url: string;
  dbs_issued_on: string;
  dbs_path: DbsPath | null;
  emergency_alt_phone: string;
  emergency_country: string;
  emergency_email: string;
  emergency_informed: string;
  emergency_mobile: string;
  emergency_name: string;
  emergency_relationship: string;
  equipment_condition: string;
  equipment_owned: string[];
  equipment_ownership: string;
  equipment_transport: string;
  experience_band: string;
  full_name: string;
  headshot_url: string;
  id_document_url: string;
  insurance_certificate_url: string;
  insurance_cover_amount: string;
  insurance_expiry_date: string;
  insurance_path: InsurancePath | null;
  insurance_policy_number: string;
  insurance_provider: string;
  location_tracking_consent_accepted: boolean;
  location_tracking_consent_version: string;
  payout_preference: "weekly" | "monthly";
  phone: string;
  ppe_owned: string[];
  prior_work_duration: string;
  prior_work_employer: string;
  prior_work_summary: string;
  prior_work_type: string;
  products_owned: string[];
  products_ownership: string;
  safety_acknowledged: boolean;
  services: string[];
  skills_exam_answers: Record<string, SkillsExamAnswer>;
  specialised_equipment: string[];
  specialised_training: string;
  training_agreements: boolean[];
  transport_mode: string;
  agreement_keys: string[];
  utr_clarity_confirmed: boolean;
  utr_document_url: string;
  utr_number: string;
  utr_path: UtrPath | null;
  /** Client-side review flags merged into verification_flags on submit. */
  verification_flags: Record<string, unknown>;
  home_base: string;
  home_base_lat: number | null;
  home_base_lng: number | null;
  working_areas: string[];
  working_radius_miles: number;
  years_experience: number;
};

export function OnboardingWizard({
  cleaner,
  preview = false,
  profile,
  takenSlots = [],
}: {
  cleaner: CleanerProfile;
  preview?: boolean;
  profile: Profile;
  takenSlots?: string[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<StepId | null>("about");
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<DocSlotKey | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docPreviews, setDocPreviews] = useState<
    Partial<Record<DocSlotKey, { isPdf: boolean; url: string }>>
  >({});
  const [notice, setNotice] = useState<{
    message: string;
    title: string;
  } | null>(null);
  const [fieldIssue, setFieldIssue] = useState<FieldIssue | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepSuccess, setStepSuccess] = useState<string | null>(null);
  const [applicationReference, setApplicationReference] = useState<
    string | null
  >(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const [data, setData] = useState<OnboardingData>({
    accuracy_confirmed: Boolean(cleaner.info_accuracy_confirmed_at),
    cleaning_skills_other: cleaner.cleaning_skills_other ?? "",
    emergency_relationship_other:
      cleaner.emergency_contact?.relationship_other ?? "",
    equipment_other: cleaner.equipment_other ?? "",
    insurance_activity_confirmed: Boolean(cleaner.insurance_activity_confirmed),
    insurance_insured_name: cleaner.insurance_insured_name ?? "",
    marketing_consent: Boolean(cleaner.marketing_consent_at),
    ppe_other: cleaner.ppe_other ?? "",
    preferred_hours_band: cleaner.preferred_hours_band ?? "",
    products_other: cleaner.products_other ?? "",
    reference_company: cleaner.reference_company ?? "",
    reference_contact_ok: Boolean(cleaner.reference_contact_ok),
    reference_email: cleaner.reference_email ?? "",
    reference_name: cleaner.reference_name ?? "",
    reference_phone: cleaner.reference_phone ?? "",
    reference_relationship: cleaner.reference_relationship ?? "",
    specialised_other: cleaner.specialised_other ?? "",
    training_certificate_url: cleaner.training_certificate_url ?? "",
    training_completed: cleaner.training_completed ?? [],
    training_path: cleaner.training_path ?? "",
    interview_scheduled_at: cleaner.interview_scheduled_at ?? null,
    agreement_keys: (cleaner.agreement_acceptances ?? []).map(
      (item) => item.key,
    ),
    availability: days.map((_, day_of_week) => ({
      day_of_week,
      end_time: "23:00",
      end_time_2: "",
      is_available: false,
      start_time: "07:00",
      start_time_2: "",
    })),
    bio: cleaner.bio ?? "",
    booking_preferences: cleaner.booking_preferences ?? [],
    can_transport_equipment: cleaner.can_transport_equipment ?? "",
    cleaning_skills: cleaner.cleaning_skills ?? [],
    dbs_certificate_number: cleaner.dbs_certificate_number ?? "",
    dbs_document_url: cleaner.dbs_document_url ?? "",
    dbs_issued_on: cleaner.dbs_issued_on ?? "",
    dbs_path: (cleaner.dbs_path as DbsPath | null) ?? null,
    emergency_alt_phone: cleaner.emergency_contact?.alt_phone ?? "",
    emergency_country:
      cleaner.emergency_contact?.country ?? "United Kingdom",
    emergency_email: cleaner.emergency_contact?.email ?? "",
    emergency_informed: cleaner.emergency_contact?.informed ?? "",
    emergency_mobile: cleaner.emergency_contact?.mobile ?? "",
    emergency_name: cleaner.emergency_contact?.name ?? "",
    emergency_relationship: cleaner.emergency_contact?.relationship ?? "",
    equipment_condition: cleaner.equipment_condition ?? "",
    equipment_owned: cleaner.equipment_owned ?? [],
    equipment_ownership: cleaner.equipment_ownership ?? "",
    equipment_transport: cleaner.equipment_transport ?? "",
    experience_band: cleaner.experience_band ?? "",
    full_name: profile.full_name,
    headshot_url: cleaner.headshot_url ?? "",
    id_document_url: cleaner.id_document_url ?? "",
    insurance_certificate_url: cleaner.insurance_certificate_url ?? "",
    insurance_cover_amount: cleaner.insurance_cover_amount ?? "",
    insurance_expiry_date: cleaner.insurance_expiry_date ?? "",
    insurance_path: (cleaner.insurance_path as InsurancePath | null) ?? null,
    insurance_policy_number: cleaner.insurance_policy_number ?? "",
    insurance_provider: cleaner.insurance_provider ?? "",
    location_tracking_consent_accepted: Boolean(
      cleaner.location_tracking_consent_at,
    ),
    location_tracking_consent_version: "cleaner-location-consent-v1",
    payout_preference: cleaner.payout_preference || "weekly",
    phone: profile.phone ?? "",
    ppe_owned: cleaner.ppe_owned ?? [],
    prior_work_duration: cleaner.prior_work_duration ?? "",
    prior_work_employer: cleaner.prior_work_employer ?? "",
    prior_work_summary: cleaner.prior_work_summary ?? "",
    prior_work_type: cleaner.prior_work_type ?? "",
    products_owned: cleaner.products_owned ?? [],
    products_ownership: cleaner.products_ownership ?? "",
    safety_acknowledged: Boolean(cleaner.safety_acknowledged_at),
    services: [] as string[],
    skills_exam_answers: {},
    specialised_equipment: cleaner.specialised_equipment ?? [],
    specialised_training: cleaner.specialised_training ?? "",
    training_agreements: CHARTER_AGREEMENTS.map(() => false),
    transport_mode: cleaner.transport_mode ?? "",
    utr_clarity_confirmed: false,
    utr_document_url: cleaner.utr_document_url ?? "",
    utr_number: cleaner.utr_number ?? "",
    utr_path: (cleaner.utr_path as UtrPath | null) ?? null,
    verification_flags:
      cleaner.verification_flags &&
      typeof cleaner.verification_flags === "object"
        ? { ...cleaner.verification_flags }
        : {},
    home_base: "",
    home_base_lat: null,
    home_base_lng: null,
    working_areas: [] as string[],
    working_radius_miles: Math.min(
      MAX_RADIUS_MILES,
      Math.max(
        1,
        Math.round(
          (cleaner.working_radius_km ?? DEFAULT_RADIUS_MILES * 1.609344) /
            1.609344,
        ),
      ),
    ),
    years_experience: cleaner.years_experience ?? 0,
  });

  const draftKey = `mundoria-cleaner-onboarding:${profile.id}`;

  useEffect(() => {
    window.localStorage.removeItem("mundoria-cleaner-onboarding");
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      try {
        setData((current) =>
          sanitizeOnboardingData({
            ...current,
            ...(JSON.parse(saved) as Partial<OnboardingData>),
          }),
        );
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }
  }, [draftKey]);

  useEffect(() => {
    window.localStorage.setItem(draftKey, JSON.stringify(data));
  }, [data, draftKey]);

  useEffect(() => {
    const accountName = profile.full_name.trim();
    const accountPhone = (profile.phone ?? "").trim();
    setData((current) => {
      const nextName =
        accountName.length >= 2 ? accountName : current.full_name;
      const nextPhone =
        accountPhone.length >= 7 ? accountPhone : current.phone;
      if (nextName === current.full_name && nextPhone === current.phone) {
        return current;
      }
      return { ...current, full_name: nextName, phone: nextPhone };
    });
  }, [profile.full_name, profile.phone]);

  useEffect(
    () => () => {
      if (advanceTimer.current != null) {
        window.clearTimeout(advanceTimer.current);
      }
    },
    [],
  );

  function update<Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) {
    setNotice(null);
    setFieldIssue(null);
    setPreviewNote(null);
    setSavedNote(null);
    setStepSuccess(null);
    setData((current) => ({ ...current, [key]: value }));
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1600);
  }

  function toggleStep(stepId: StepId) {
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setNotice(null);
    setFieldIssue(null);
    setStepSuccess(null);
    setSavedNote(null);
    setExpanded(stepId);
    setMobileNavOpen(false);
  }

  function documentField(kind: DocKind) {
    if (kind === "headshot") return "headshot_url" as const;
    if (kind === "utr") return "utr_document_url" as const;
    if (kind === "insurance") return "insurance_certificate_url" as const;
    if (kind === "training") return "training_certificate_url" as const;
    return `${kind}_document_url` as const;
  }

  function documentBucket(kind: DocKind) {
    return kind === "headshot" ? "avatars" : "cleaner-documents";
  }

  function setDocPreview(
    slot: DocSlotKey,
    url: string | null,
    isPdf = false,
  ) {
    setDocPreviews((current) => {
      const previous = current[slot]?.url;
      if (previous?.startsWith("blob:") && previous !== url) {
        URL.revokeObjectURL(previous);
      }
      if (!url) {
        const next = { ...current };
        delete next[slot];
        return next;
      }
      return { ...current, [slot]: { isPdf, url } };
    });
  }

  function referenceLooksLikePdf(reference: string) {
    return /\.pdf($|\?)/i.test(reference);
  }

  async function resolveDocPreview(
    kind: DocKind,
    reference: string,
    side = 0,
  ) {
    const slot = docSlotKey(kind, side);
    if (!reference) {
      setDocPreview(slot, null);
      return;
    }
    const isPdf = referenceLooksLikePdf(reference);
    if (
      reference.startsWith("blob:") ||
      reference.startsWith("http://") ||
      reference.startsWith("https://")
    ) {
      setDocPreview(slot, reference, isPdf);
      return;
    }
    if (preview) return;
    const bucket = documentBucket(kind);
    const path = ownStoragePath(bucket, reference, profile.id) ?? reference;
    const { data: signed, error } = await createBrowserClient()
      .storage.from(bucket)
      .createSignedUrl(path, 60 * 30);
    if (error || !signed?.signedUrl) return;
    setDocPreview(
      slot,
      signed.signedUrl,
      isPdf || referenceLooksLikePdf(path),
    );
  }

  useEffect(() => {
    const idUrls = parseDocumentList(data.id_document_url);
    const dbsUrls = parseDocumentList(data.dbs_document_url);
    idUrls.forEach((url, index) => {
      void resolveDocPreview("id", url, index);
    });
    dbsUrls.forEach((url, index) => {
      void resolveDocPreview("dbs", url, index);
    });
    // Drop stale list preview slots after removals.
    setDocPreviews((current) => {
      const next = { ...current };
      let changed = false;
      for (const key of Object.keys(next)) {
        const listKind = key.startsWith("dbs:")
          ? "dbs"
          : key.startsWith("id:")
            ? "id"
            : null;
        if (!listKind) continue;
        const urls = listKind === "dbs" ? dbsUrls : idUrls;
        const index = Number(key.slice(listKind.length + 1));
        if (!Number.isInteger(index) || index < 0 || index >= urls.length) {
          delete next[key as DocSlotKey];
          changed = true;
        }
      }
      return changed ? next : current;
    });
    void resolveDocPreview("utr", data.utr_document_url, 0);
    void resolveDocPreview("insurance", data.insurance_certificate_url, 0);
    void resolveDocPreview("training", data.training_certificate_url, 0);
    void resolveDocPreview("headshot", data.headshot_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve when stored refs change
  }, [
    data.id_document_url,
    data.dbs_document_url,
    data.utr_document_url,
    data.insurance_certificate_url,
    data.training_certificate_url,
    data.headshot_url,
    preview,
    profile.id,
  ]);

  async function discardDraftFile(kind: DocKind, reference: string) {
    if (!reference) return;
    if (reference.startsWith("blob:")) {
      URL.revokeObjectURL(reference);
      return;
    }
    if (preview) return;
    const path = ownStoragePath(documentBucket(kind), reference, profile.id);
    if (!path) return;
    await createBrowserClient().storage.from(documentBucket(kind)).remove([path]);
  }

  async function uploadDocument(kind: DocKind, file: File, side = 0) {
    setNotice(null);
    setFieldIssue(null);
    const field = documentField(kind);
    const slot = docSlotKey(kind, side);
    const previous = isSingleDocKind(kind)
      ? data[field]
      : isListDocKind(kind)
        ? (parseDocumentList(data[field])[side] ?? "")
        : (parseDocumentUrls(data[field])[side] ?? "");
    if (kind === "headshot" && !file.type.startsWith("image/")) {
      setNotice({
        message: "Choose a JPEG, PNG, or WebP.",
        title: "Couldn’t upload that file",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice({
        message: "Files must be 10 MB or smaller.",
        title: "Couldn’t upload that file",
      });
      return;
    }

    if (kind === "utr" || kind === "insurance" || kind === "dbs") {
      const quality = assessDocumentFile(file);
      if (!quality.ok) {
        setData((current) => ({
          ...current,
          verification_flags: mergeVerificationFlags(current.verification_flags, {
            unreadable_doc: true,
            unreadable_doc_hint:
              quality.reason === "too_small"
                ? "Upload looks unusually small — may be blank or corrupted."
                : "Upload looked empty.",
            unreadable_doc_kind: kind,
          }),
        }));
        setNotice({
          message:
            "That file looks too small or empty. Upload a clearer copy — we’ll also flag it for review.",
          title: "Document may be unreadable",
        });
      } else if (kind === "utr") {
        setData((current) => ({
          ...current,
          verification_flags: mergeVerificationFlags(current.verification_flags, {
            unreadable_doc: false,
            unreadable_doc_hint: null,
            unreadable_doc_kind: null,
          }),
        }));
      }
    }

    const localPreview = URL.createObjectURL(file);
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    setDocPreview(slot, localPreview, isPdf);
    setUploadingSlot(slot);
    setUploadProgress(0);

    try {
      if (preview) {
        if (previous) await discardDraftFile(kind, previous);
        setData((current) => ({
          ...current,
          [field]: isSingleDocKind(kind)
            ? localPreview
            : setMultiDocValue(kind, current[field], side, localPreview),
        }));
        setUploadProgress(100);
        return;
      }

      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      const accessToken = session?.access_token;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!user || !accessToken || !supabaseUrl || !anonKey) {
        if (previous) await resolveDocPreview(kind, previous, side);
        else setDocPreview(slot, null);
        setNotice({
          message: "Sign in again, then choose the file.",
          title: "Couldn’t upload that file",
        });
        return;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
      const sideTag = isSingleDocKind(kind)
        ? kind
        : isListDocKind(kind)
          ? `${kind}-page-${side + 1}`
          : `${kind}-${side === 0 ? "front" : "back"}`;
      const path = `${user.id}/${sideTag}-${Date.now()}-${safeName}`;
      const bucket = documentBucket(kind);
      try {
        await uploadWithProgress({
          accessToken,
          anonKey,
          bucket,
          file,
          onProgress: setUploadProgress,
          path,
          supabaseUrl,
        });
      } catch (uploadError) {
        if (previous) await resolveDocPreview(kind, previous, side);
        else setDocPreview(slot, null);
        const message =
          uploadError instanceof Error ? uploadError.message : "Upload failed.";
        setNotice({
          message: /row-level security|jwt|unauthorized/i.test(message)
            ? "Sign in again, then choose the file."
            : message,
          title: "Couldn’t upload that file",
        });
        return;
      }
      const nextValue =
        bucket === "avatars"
          ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
          : path;
      if (previous && previous !== nextValue) {
        await discardDraftFile(kind, previous);
      }
      setNotice(null);
      setFieldIssue(null);
      setPreviewNote(null);
      setData((current) => ({
        ...current,
        [field]: isSingleDocKind(kind)
          ? nextValue
          : setMultiDocValue(kind, current[field], side, nextValue),
      }));
      setSaveFlash(true);
      window.setTimeout(() => setSaveFlash(false), 1600);
      if (bucket === "avatars") {
        setDocPreview(slot, nextValue, false);
      } else {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 30);
        if (signed?.signedUrl) {
          setDocPreview(slot, signed.signedUrl, isPdf);
        }
      }
    } finally {
      setUploadingSlot((current) => (current === slot ? null : current));
      setUploadProgress(0);
    }
  }

  async function removeDocument(kind: DocKind, side = 0) {
    const field = documentField(kind);
    const slot = docSlotKey(kind, side);
    const current = isSingleDocKind(kind)
      ? data[field]
      : isListDocKind(kind)
        ? (parseDocumentList(data[field])[side] ?? "")
        : (parseDocumentUrls(data[field])[side] ?? "");
    if (!current) return;
    setNotice(null);
    setFieldIssue(null);
    if (!current.startsWith("blob:") && !preview) {
      const path = ownStoragePath(documentBucket(kind), current, profile.id);
      if (path) {
        const { error: removeError } = await createBrowserClient()
          .storage.from(documentBucket(kind))
          .remove([path]);
        if (removeError) {
          setNotice({
            message: removeError.message,
            title: "Couldn’t remove that file",
          });
          return;
        }
      }
    }
    if (current.startsWith("blob:")) URL.revokeObjectURL(current);
    setDocPreview(slot, null);
    setNotice(null);
    setFieldIssue(null);
    setData((current) => ({
      ...current,
      [field]: isSingleDocKind(kind)
        ? ""
        : setMultiDocValue(kind, current[field], side, ""),
    }));
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1600);
  }

  async function submit() {
    const normalized = sanitizeOnboardingData(data);

    for (const step of STEPS) {
      const validationError = validateStep(step.id, normalized);

      if (validationError) {
        setData(normalized);
        setExpanded(step.id);
        setFieldIssue(validationError);
        setNotice({
          message: "Finish the highlighted step, then try again.",
          title: "Couldn’t submit your application",
        });
        return;
      }
    }

    setData(normalized);
    if (preview) {
      setPreviewNote(
        "Preview only. This application was not submitted.",
      );
      return;
    }
    setSubmitting(true);

    try {
      const response = await fetch("/api/cleaner/onboarding", {
        body: JSON.stringify(normalized),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as {
        application_reference?: string;
        error?: string;
      };

      if (!response.ok) {
        setFieldIssue(null);
        setNotice({
          message: result.error ?? "Try again in a moment.",
          title: "Couldn’t submit your application",
        });
        return;
      }

      window.localStorage.removeItem("mundoria-cleaner-onboarding");
      window.localStorage.removeItem(draftKey);
      setApplicationReference(result.application_reference ?? null);
      setSubmitted(true);
    } catch (submitError) {
      setFieldIssue(null);
      setNotice({
        message:
          submitError instanceof Error
            ? submitError.message
            : "Try again in a moment.",
        title: "Couldn’t submit your application",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const completedCount = STEPS.filter((step) =>
    isStepComplete(step.id, data),
  ).length;
  const activeStep =
    STEPS.find((step) => step.id === expanded) ?? STEPS[0];
  const minutesLeft = STEPS.filter(
    (step) => !isStepComplete(step.id, data),
  ).reduce((sum, step) => sum + step.minutes, 0);
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  function continueFromStep(source: OnboardingData = data) {
    const validationError = validateStep(activeStep.id, source);
    if (validationError) {
      setFieldIssue(validationError);
      setNotice(null);
      return;
    }
    setFieldIssue(null);
    setNotice(null);
    setSavedNote(null);
    const index = STEPS.findIndex((step) => step.id === activeStep.id);
    const next = STEPS[index + 1];
    const successMessage = stepSuccessMessage(activeStep.id, source);
    if (next && successMessage) {
      // Show the confirmation banner briefly, then advance.
      setStepSuccess(successMessage);
      if (advanceTimer.current != null) {
        window.clearTimeout(advanceTimer.current);
      }
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        toggleStep(next.id);
      }, 900);
      return;
    }
    if (next) {
      toggleStep(next.id);
      return;
    }
    void submit();
  }

  /** "I'll do this later" on UTR / DBS / insurance: soft path, then move on. */
  function deferStep(stepId: "utr" | "dbs" | "insurance") {
    const patch: Partial<OnboardingData> = {};
    if (stepId === "utr" && (!data.utr_path || data.utr_path === "have")) {
      patch.utr_path = "none";
    }
    if (stepId === "dbs" && (!data.dbs_path || data.dbs_path === "have")) {
      patch.dbs_path = "apply";
    }
    if (
      stepId === "insurance" &&
      (!data.insurance_path || data.insurance_path === "have")
    ) {
      patch.insurance_path = "none";
    }
    const nextData = { ...data, ...patch };
    if (Object.keys(patch).length > 0) setData(nextData);
    continueFromStep(nextData);
  }

  function saveAndFinishLater() {
    setNotice(null);
    setFieldIssue(null);
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1600);
    setSavedNote(
      preview
        ? "Preview only — nothing is saved."
        : "Your progress is saved on this device. You can log out and come back to finish later.",
    );
  }

  async function logout() {
    await createBrowserClient().auth.signOut();
    router.replace("/login/cleaner");
    router.refresh();
  }

  const stepIndex = STEPS.findIndex((item) => item.id === activeStep.id) + 1;
  // Forward steps slide in from the right, earlier steps from the left.
  const lastStepIndexRef = useRef(stepIndex);
  const stepDirection: 1 | -1 = stepIndex >= lastStepIndexRef.current ? 1 : -1;
  useEffect(() => {
    lastStepIndexRef.current = stepIndex;
  }, [stepIndex]);
  const appointmentActive = activeStep.id === "appointment";
  const isLastStep = stepIndex >= STEPS.length;
  const allComplete = completedCount >= STEPS.length;
  const submitsDocs =
    (activeStep.id === "utr" && data.utr_path === "have") ||
    (activeStep.id === "dbs" && data.dbs_path === "have") ||
    (activeStep.id === "insurance" && data.insurance_path === "have");
  const continueLabel = submitting
    ? "Submitting…"
    : isLastStep
      ? "Submit my application"
      : submitsDocs
        ? "Submit & continue"
        : "Save and continue";

  function goBack() {
    const previous = STEPS[stepIndex - 2];
    if (previous) toggleStep(previous.id);
  }

  function goContinue() {
    if (isLastStep && allComplete) {
      void submit();
      return;
    }
    if (isLastStep && !allComplete) {
      const firstOpen = STEPS.find((step) => !isStepComplete(step.id, data));
      if (firstOpen) toggleStep(firstOpen.id);
      return;
    }
    continueFromStep();
  }

  if (submitted) {
    const outstanding = [
      data.utr_path !== "have" ? "UTR number and proof" : null,
      data.dbs_path !== "have" ? "Basic DBS certificate" : null,
      data.insurance_path !== "have" ? "Public Liability insurance" : null,
    ].filter((item): item is string => Boolean(item));
    return (
      <main
        className={cn(
          "flex min-h-screen items-center justify-center px-4 py-10 text-[#1c133b]",
          ONBOARDING_PAGE_BG,
        )}
      >
        <div className="w-full max-w-lg rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1c133b] bg-[#efe8fa]">
              <Check className="h-6 w-6 text-[#312c79]" strokeWidth={3} />
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#312c79]">
              Application Submitted!
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#5a5470]">
              Thanks — we’re reviewing your application. This usually takes a
              few working days.
            </p>
          </div>

          {applicationReference ? (
            <div className="mt-5 rounded-xl border-2 border-[#1c133b]/25 bg-[#f3eee4] px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8798]">
                Application reference
              </p>
              <p className="mt-1 text-lg font-semibold tracking-wide text-[#1c133b]">
                {applicationReference}
              </p>
            </div>
          ) : null}

          {data.interview_scheduled_at ? (
            <p className="mt-4 rounded-xl bg-[#f3eee4] px-4 py-3 text-center text-sm font-medium text-[#1c133b]">
              Interview booked:{" "}
              {formatAppointmentSummary(data.interview_scheduled_at)}
            </p>
          ) : null}

          <h2 className="mt-6 text-sm font-semibold text-[#1c133b]">
            What&apos;s next?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5a5470]">
            Once your application has been submitted:
          </p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#5a5470]">
            <li>
              <span className="font-medium text-[#1c133b]">
                Application review:
              </span>{" "}
              Our team checks the information and documents you&apos;ve
              provided.
            </li>
            <li>
              <span className="font-medium text-[#1c133b]">Verification:</span>{" "}
              We confirm your identity, required checks and eligibility for
              your selected cleaning services
              {data.interview_scheduled_at
                ? ", including your booked online interview"
                : ""}
              .
              {outstanding.length > 0
                ? ` Still to add from your dashboard: ${outstanding.join(", ")}.`
                : ""}
            </li>
            <li>
              <span className="font-medium text-[#1c133b]">
                Additional information:
              </span>{" "}
              If anything is missing, we&apos;ll contact you and explain what
              to do.
            </li>
            <li>
              <span className="font-medium text-[#1c133b]">Approval:</span> Once
              approved, your cleaner profile will be activated for eligible
              services.
            </li>
            <li>
              <span className="font-medium text-[#1c133b]">
                Start receiving bookings:
              </span>{" "}
              You&apos;ll be able to view suitable cleaning opportunities
              through Mundoria.
            </li>
          </ol>
          <p className="mt-3 text-xs leading-5 text-[#8b8798]">
            You can track your progress at any time through your cleaner
            dashboard.
          </p>

          <Button
            className="mt-6 w-full rounded-xl bg-[#312c79] hover:bg-[#271f5c]"
            onClick={() => {
              router.push("/cleaner/dashboard");
              router.refresh();
            }}
            size="lg"
          >
            View My Application
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={cn("min-h-screen text-[#1c133b]", ONBOARDING_PAGE_BG)}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px]">
        <aside
          className={cn(
            "sticky top-0 z-20 hidden h-[100dvh] shrink-0 flex-col border-r border-[#e8e0d0]/80 transition-[width] duration-200 md:flex",
            ONBOARDING_PAGE_BG,
            desktopNavCollapsed ? "w-[3.75rem]" : "w-[260px] lg:w-[280px]",
          )}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "flex shrink-0 items-start gap-2 border-b border-[#e8e0d0]/60 py-5",
                desktopNavCollapsed ? "justify-center px-2" : "px-5 lg:px-6",
              )}
            >
              {!desktopNavCollapsed ? (
                <div className="min-w-0 flex-1 pt-0.5">
                  <LandingLogo href="/cleaner/dashboard" />
                </div>
              ) : null}
              <button
                aria-expanded={!desktopNavCollapsed}
                aria-label={
                  desktopNavCollapsed
                    ? "Expand onboarding steps"
                    : "Collapse onboarding steps"
                }
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1c133b]/25 text-[#1c133b] transition hover:border-[#1c133b] hover:bg-[#f3eee4]"
                onClick={() => setDesktopNavCollapsed((open) => !open)}
                type="button"
              >
                {desktopNavCollapsed ? (
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                )}
              </button>
            </div>

            {desktopNavCollapsed ? (
              <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto overscroll-contain px-2 py-4">
                <p className="text-center text-[10px] font-semibold tabular-nums text-[#8b8798]">
                  {completedCount}/{STEPS.length}
                </p>
                <div
                  aria-hidden
                  className="h-16 w-1.5 overflow-hidden rounded-full bg-[#e8e0d0]"
                >
                  <motion.div
                    animate={{ height: `${progressPercent}%` }}
                    className="w-full rounded-full bg-[#1c133b]"
                    initial={false}
                    transition={SPRING.snappy}
                  />
                </div>
                {STEPS.map((step, index) => {
                  const complete = isStepComplete(step.id, data);
                  const isOpen = expanded === step.id;
                  return (
                    <button
                      aria-current={isOpen ? "step" : undefined}
                      aria-label={step.label}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition",
                        isOpen
                          ? "border-[#1c133b] bg-[#1c133b] text-white"
                          : complete
                            ? "border-[#312c79] bg-[#312c79] text-white"
                            : "border-[#1c133b]/35 bg-[#f9f6ef] text-[#8b8798]",
                      )}
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      title={step.label}
                      type="button"
                    >
                      {complete && !isOpen ? (
                        <motion.span
                            animate={{ rotate: 0, scale: 1 }}
                            className="inline-flex"
                            initial={{ rotate: -45, scale: 0 }}
                            transition={SPRING.lively}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </motion.span>
                      ) : (
                        index + 1
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="shrink-0 px-5 pt-5 lg:px-6">
                  <h1 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                    Your onboarding
                  </h1>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b8798]">
                      <span>
                        {completedCount} of {STEPS.length} done
                      </span>
                      <span>~{Math.max(minutesLeft, 1)} min left</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e0d0]">
                      <motion.div
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full rounded-full bg-[#1c133b]"
                        initial={false}
                        transition={SPRING.snappy}
                      />
                    </div>
                  </div>
                </div>
                <nav
                  aria-label="Onboarding steps"
                  className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 lg:px-6"
                  tabIndex={0}
                >
                  <OnboardingStepList
                    activeId={expanded}
                    data={data}
                    onSelect={toggleStep}
                  />
                </nav>
                <div className="shrink-0 border-t border-[#e8e0d0]/60 px-5 py-4 lg:px-6">
                  {!preview ? (
                    <div className="flex flex-col items-start gap-1.5">
                      <a
                        className="text-sm font-medium text-[#8b8798] transition hover:text-[#1c133b]"
                        href="/help"
                      >
                        Help
                      </a>
                      <button
                        className="text-left text-sm font-medium text-[#8b8798] transition hover:text-[#1c133b]"
                        onClick={() => void logout()}
                        type="button"
                      >
                        Log out
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#a39fb0]">Preview mode</p>
                  )}
                  <p
                    aria-live="polite"
                    className={cn(
                      "mt-3 text-xs font-medium transition",
                      saveFlash ? "text-[#312c79]" : "text-transparent",
                    )}
                  >
                    Progress saved
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-10 md:pb-10 lg:px-12">
          <div className="mb-5 md:hidden">
            <LandingLogo href="/cleaner/dashboard" />
          </div>

          <div className="mb-5 md:hidden">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b8798]">
              <span>
                {completedCount} of {STEPS.length} done
              </span>
              <span>~{Math.max(minutesLeft, 1)} min left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e0d0]">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full bg-[#1c133b]"
                initial={false}
                transition={SPRING.snappy}
              />
            </div>

            <div className="mt-3 rounded-2xl border-2 border-[#1c133b]/20 bg-[#f9f6ef]">
              <button
                aria-controls="mobile-onboarding-steps"
                aria-expanded={mobileNavOpen}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left touch-manipulation"
                onClick={() => setMobileNavOpen((open) => !open)}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b8798]">
                    Steps · {stepIndex} of {STEPS.length}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-[#1c133b]">
                    {activeStep.label}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-4 w-4 shrink-0 text-[#1c133b] transition",
                    mobileNavOpen && "rotate-180",
                  )}
                  strokeWidth={2.25}
                />
              </button>
              {mobileNavOpen ? (
                <div
                  className="max-h-[min(55dvh,24rem)] overflow-y-auto overscroll-contain border-t border-[#e8e0d0] px-2.5 py-3"
                  id="mobile-onboarding-steps"
                >
                  <OnboardingStepList
                    activeId={expanded}
                    data={data}
                    indicatorId="onboarding-step-active-mobile"
                    onSelect={toggleStep}
                  />
                  {!preview ? (
                    <div className="mt-3 flex items-center gap-4 border-t border-[#e8e0d0] px-1 pt-3">
                      <a
                        className="text-sm font-medium text-[#8b8798] transition hover:text-[#1c133b]"
                        href="/help"
                      >
                        Help
                      </a>
                      <button
                        className="text-sm font-medium text-[#8b8798] transition hover:text-[#1c133b]"
                        onClick={() => void logout()}
                        type="button"
                      >
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p
              aria-live="polite"
              className={cn(
                "mt-2 text-xs font-medium transition",
                saveFlash ? "text-[#312c79]" : "text-transparent",
              )}
            >
              Progress saved
            </p>
          </div>

          <AnimatePresence custom={stepDirection} initial={false} mode="wait">
          <motion.div
            animate="center"
            custom={stepDirection}
            exit="exit"
            initial="enter"
            key={activeStep.id}
            variants={slideStep}
          >
          <header className="mb-1">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <Image
                alt=""
                className="h-11 w-11 shrink-0 sm:h-16 sm:w-16"
                height={64}
                src={STEP_HEADER_ICONS[activeStep.id]}
                width={64}
              />
              <div className="min-w-0">
                <h2 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-[#312c79] sm:text-[2.55rem] sm:leading-none">
                  {activeStep.label}
                </h2>
              </div>
            </div>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-[#5a5470] sm:mt-3.5 sm:text-base sm:leading-7">
              {STEP_WHY[activeStep.id]}
            </p>
            {appointmentActive ? (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#5a5470]">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#1c133b]" strokeWidth={2} />
                  {INTERVIEW_DURATION_MINUTES} min
                </span>
                <span className="inline-flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-[#1c133b]" strokeWidth={2} />
                  Online video call
                </span>
                <span className="inline-flex items-center gap-2 text-[#8b8798]">
                  Times shown in UK time
                </span>
              </div>
            ) : null}
          </header>

          <div className="mt-5 sm:mt-7">
            <StepBody
              askForPhone={(profile.phone ?? "").trim().length < 7}
              data={data}
              docPreviews={docPreviews}
              issue={fieldIssue}
              onFile={(kind, file, side) =>
                void uploadDocument(kind, file, side)
              }
              onRemove={(kind, side) => void removeDocument(kind, side)}
              onUpdate={update}
              onDefer={deferStep}
              onEditStep={toggleStep}
              onSchedule={(startsAt) =>
                update("interview_scheduled_at", startsAt)
              }
              stepId={activeStep.id}
              stepSuccess={stepSuccess}
              takenSlots={takenSlots}
              uploadProgress={uploadProgress}
              uploadingSlot={uploadingSlot}
            />
          </div>
          </motion.div>
          </AnimatePresence>

          {notice ? (
            <div className="mt-4">
              <ActionError message={notice.message} title={notice.title} />
            </div>
          ) : null}
          {previewNote ? (
            <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              {previewNote}
            </p>
          ) : null}
          {savedNote ? (
            <p
              className="mt-4 hidden rounded-xl border-2 border-[#1c133b]/25 bg-[#f3eee4] p-3 text-sm text-[#1c133b] md:block"
              role="status"
            >
              {savedNote}
            </p>
          ) : null}

          <div className="mt-8 hidden items-center justify-between gap-3 md:flex">
            <button
              className="text-sm font-medium text-[#8b8798] hover:text-[#1c133b] disabled:opacity-40"
              disabled={stepIndex <= 1}
              onClick={goBack}
              type="button"
            >
              Back
            </button>
            <div className="flex items-center gap-4">
              <button
                className="text-sm font-semibold text-[#312c79] underline-offset-2 hover:underline disabled:opacity-40"
                disabled={submitting}
                onClick={saveAndFinishLater}
                type="button"
              >
                Save &amp; finish later
              </button>
              <Button
                className="rounded-xl bg-[#312c79] px-6 hover:bg-[#271f5c]"
                disabled={submitting}
                onClick={goContinue}
                size="lg"
              >
                {continueLabel}
              </Button>
            </div>
          </div>
          {isLastStep && !allComplete ? (
            <p className="mt-3 hidden text-right text-xs text-[#8b8798] md:block">
              Complete every step before you submit. Incomplete steps are marked
              in the step list.
            </p>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e0d0]/80 bg-[#f9f6ef]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3">
          <button
            className="shrink-0 px-1 text-sm font-medium text-[#8b8798] touch-manipulation disabled:opacity-40"
            disabled={stepIndex <= 1}
            onClick={goBack}
            type="button"
          >
            Back
          </button>
          <Button
            className="h-12 flex-1 rounded-xl bg-[#312c79] touch-manipulation hover:bg-[#271f5c]"
            disabled={submitting}
            onClick={goContinue}
            size="lg"
          >
            {continueLabel}
          </Button>
        </div>
        <button
          className="mx-auto mt-2 block text-xs font-semibold text-[#312c79] touch-manipulation disabled:opacity-40"
          disabled={submitting}
          onClick={saveAndFinishLater}
          type="button"
        >
          Save &amp; finish later
        </button>
        {savedNote ? (
          <p className="mx-auto mt-1 max-w-[1200px] text-center text-[11px] leading-4 text-[#5a5470]">
            {savedNote}
          </p>
        ) : null}
        {isLastStep && !allComplete ? (
          <p className="mx-auto mt-2 max-w-[1200px] text-center text-[11px] leading-4 text-[#8b8798]">
            Complete every step before you submit.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function OnboardingStepList({
  activeId,
  data,
  indicatorId = "onboarding-step-active",
  onSelect,
}: {
  activeId: StepId | null;
  /** Unique per rendered list so desktop and mobile lists animate independently. */
  indicatorId?: string;
  data: OnboardingData;
  onSelect: (stepId: StepId) => void;
}) {
  return (
    <div className="space-y-7">
      {GROUPS.map((group) => {
        const steps = group.ids
          .map((id) => STEPS.find((step) => step.id === id))
          .filter((step): step is (typeof STEPS)[number] => Boolean(step));
        const groupDone = steps.every((step) =>
          isStepComplete(step.id, data),
        );
        return (
          <section key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8798]">
              {group.title}
              {groupDone ? " · Done" : ""}
            </h2>
            <ol className="mt-3.5 space-y-0.5">
              {steps.map((step) => {
                const complete = isStepComplete(step.id, data);
                const isOpen = activeId === step.id;
                return (
                  <li key={step.id}>
                    <button
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition touch-manipulation",
                        !isOpen && "hover:bg-[#f3eee4]/70",
                      )}
                      onClick={() => onSelect(step.id)}
                      type="button"
                    >
                      {isOpen ? (
                        <motion.span
                          aria-hidden
                          className="absolute inset-0 rounded-xl bg-[#f3eee4]"
                          layoutId={indicatorId}
                          transition={SPRING.snappy}
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          isOpen
                            ? "border-[#1c133b] bg-[#1c133b]"
                            : complete
                              ? "border-[#312c79] bg-[#312c79] text-white"
                              : "border-[#1c133b]/35 bg-[#f9f6ef]",
                        )}
                      >
                        {complete && !isOpen ? (
                          <motion.span
                            animate={{ rotate: 0, scale: 1 }}
                            className="inline-flex"
                            initial={{ rotate: -45, scale: 0 }}
                            transition={SPRING.lively}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </motion.span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "relative min-w-0 flex-1 text-[15px] leading-snug",
                          isOpen
                            ? "font-semibold text-[#1c133b]"
                            : complete
                              ? "font-medium text-[#291845]"
                              : "font-medium text-[#8b8798]",
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function StepBody({
  askForPhone,
  data,
  docPreviews,
  issue,
  onDefer,
  onEditStep,
  onFile,
  onRemove,
  onSchedule,
  onUpdate,
  stepId,
  stepSuccess,
  takenSlots,
  uploadProgress,
  uploadingSlot,
}: {
  askForPhone: boolean;
  data: OnboardingData;
  docPreviews: Partial<Record<DocSlotKey, { isPdf: boolean; url: string }>>;
  issue: FieldIssue | null;
  onDefer: (stepId: "utr" | "dbs" | "insurance") => void;
  onEditStep: (stepId: StepId) => void;
  onFile: (kind: DocKind, file: File, side?: number) => void;
  onRemove: (kind: DocKind, side?: number) => void;
  onSchedule: (startsAt: string) => void;
  onUpdate: <Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) => void;
  stepId: StepId;
  stepSuccess: string | null;
  takenSlots: string[];
  uploadProgress: number;
  uploadingSlot: DocSlotKey | null;
}) {
  const issueFor = (field: string) =>
    issue?.field === field ? issue.message : undefined;

  if (stepId === "appointment") {
    return (
      <AppointmentPicker
        error={issueFor("slot")}
        onSchedule={onSchedule}
        selected={data.interview_scheduled_at}
        takenSlots={takenSlots}
      />
    );
  }

  if (stepId === "services") {
    return (
      <ServicesPicker
        error={issueFor("services")}
        onChange={(next) => onUpdate("services", next)}
        selected={data.services}
      />
    );
  }

  if (stepId === "hours") {
    return (
      <div>
        <HoursPicker
          error={issueFor("hours") ?? issueFor("preferred_hours")}
          onChange={(next) => onUpdate("availability", next)}
          onPreferredHours={(next) => onUpdate("preferred_hours_band", next)}
          preferredHoursBand={data.preferred_hours_band}
          value={data.availability}
        />
        <InfoCallout>
          Going on holiday or need time off? Once you’re approved you can block
          dates in your Diary so you won’t be offered jobs on those days.
        </InfoCallout>
      </div>
    );
  }

  if (stepId === "coverage") {
    return (
      <div>
        <CoverageStep
          areas={data.working_areas}
          error={
            issueFor("home_base") ??
            issueFor("radius") ??
            issueFor("areas") ??
            issueFor("transport")
          }
          homeBase={data.home_base}
          homeBaseLat={data.home_base_lat}
          homeBaseLng={data.home_base_lng}
          onAreas={(next) => onUpdate("working_areas", next)}
          onHomeBase={(next) => onUpdate("home_base", next)}
          onHomeCoords={(lat, lng) => {
            onUpdate("home_base_lat", lat);
            onUpdate("home_base_lng", lng);
          }}
          onRadiusMiles={(next) => onUpdate("working_radius_miles", next)}
          radiusMiles={data.working_radius_miles}
        />
        <LocationExtras
          canTransportEquipment={data.can_transport_equipment}
          error={issueFor("transport")}
          onCanTransport={(next) => onUpdate("can_transport_equipment", next)}
          onTransportMode={(next) => onUpdate("transport_mode", next)}
          transportMode={data.transport_mode}
        />
      </div>
    );
  }

  if (stepId === "quiz") {
    return (
      <TrainingSurvey
        agreements={data.training_agreements}
        answers={data.skills_exam_answers}
        error={issueFor("quiz")}
        onAgreements={(next) => onUpdate("training_agreements", next)}
        onAnswers={(next) => onUpdate("skills_exam_answers", next)}
      />
    );
  }

  if (stepId === "utr") {
    return (
      <UtrComplianceStep
        clarityConfirmed={data.utr_clarity_confirmed}
        error={issueFor("utr")}
        onClarityConfirmed={(next) => onUpdate("utr_clarity_confirmed", next)}
        onDefer={() => onDefer("utr")}
        onPath={(next) => {
          onUpdate("utr_path", next);
          if (next === "none") onUpdate("utr_number", "");
        }}
        onProofFile={(file) => onFile("utr", file, 0)}
        onProofRemove={() => onRemove("utr", 0)}
        onUtrChange={(next) => onUpdate("utr_number", next)}
        onWaiting={(waiting) =>
          onUpdate("utr_path", waiting ? "waiting" : "none")
        }
        path={data.utr_path}
        proofPreview={docPreviews["utr:0"]}
        proofQualityWarning={
          data.verification_flags.unreadable_doc
            ? String(
                data.verification_flags.unreadable_doc_hint ??
                  "This upload may be hard to read. Prefer a clearer scan or photo.",
              )
            : null
        }
        proofUploaded={Boolean(
          docPreviews["utr:0"]?.url || data.utr_document_url,
        )}
        proofUploading={uploadingSlot === "utr:0"}
        successMessage={stepSuccess}
        uploadProgress={uploadProgress}
        utrNumber={data.utr_number}
        waitingRegistered={data.utr_path === "waiting"}
      />
    );
  }

  if (stepId === "identity") {
    return (
      <IdentityStep
        idUrls={parseDocumentList(data.id_document_url)}
        issue={issueFor("id")}
        onFile={(file, slot) => onFile("id", file, slot)}
        onRemove={(slot) => onRemove("id", slot)}
        pagePreviews={docPreviews}
        uploadProgress={uploadProgress}
        uploadingSlot={uploadingSlot}
      />
    );
  }

  if (stepId === "dbs") {
    return (
      <DbsComplianceStep
        certificateNumber={data.dbs_certificate_number}
        error={issueFor("dbs")}
        issuedOn={data.dbs_issued_on}
        onCertificateNumber={(next) =>
          onUpdate("dbs_certificate_number", next)
        }
        onFile={(file, slot) => onFile("dbs", file, slot)}
        onDefer={() => onDefer("dbs")}
        onIssuedOn={(next) => onUpdate("dbs_issued_on", next)}
        onPath={(next) => onUpdate("dbs_path", next)}
        onRemove={(slot) => onRemove("dbs", slot)}
        pagePreviews={docPreviews}
        path={data.dbs_path}
        successMessage={stepSuccess}
        uploadProgress={uploadProgress}
        uploadingSlot={uploadingSlot}
        urls={parseDocumentList(data.dbs_document_url)}
      />
    );
  }

  if (stepId === "insurance") {
    return (
      <InsuranceComplianceStep
        activityConfirmed={data.insurance_activity_confirmed}
        coverAmount={data.insurance_cover_amount}
        error={issueFor("insurance")}
        expiryDate={data.insurance_expiry_date}
        insuredName={data.insurance_insured_name}
        onActivityConfirmed={(next) =>
          onUpdate("insurance_activity_confirmed", next)
        }
        onCoverAmount={(next) => onUpdate("insurance_cover_amount", next)}
        onDefer={() => onDefer("insurance")}
        onExpiryDate={(next) => onUpdate("insurance_expiry_date", next)}
        onFile={(file) => onFile("insurance", file, 0)}
        onInsuredName={(next) => onUpdate("insurance_insured_name", next)}
        onPath={(next) => onUpdate("insurance_path", next)}
        onPolicyNumber={(next) => onUpdate("insurance_policy_number", next)}
        onProvider={(next) => onUpdate("insurance_provider", next)}
        onRemove={() => onRemove("insurance", 0)}
        path={data.insurance_path}
        policyNumber={data.insurance_policy_number}
        preview={docPreviews["insurance:0"]}
        provider={data.insurance_provider}
        successMessage={stepSuccess}
        uploaded={Boolean(
          docPreviews["insurance:0"]?.url || data.insurance_certificate_url,
        )}
        uploading={uploadingSlot === "insurance:0"}
        uploadProgress={uploadProgress}
      />
    );
  }

  if (stepId === "equipment") {
    return (
      <EquipmentComplianceStep
        equipmentOther={data.equipment_other}
        equipmentOwned={data.equipment_owned}
        equipmentOwnership={data.equipment_ownership}
        onEquipmentOther={(next) => onUpdate("equipment_other", next)}
        onEquipmentOwned={(next) => onUpdate("equipment_owned", next)}
        onEquipmentOwnership={(next) => onUpdate("equipment_ownership", next)}
        onProductsOther={(next) => onUpdate("products_other", next)}
        onProductsOwned={(next) => onUpdate("products_owned", next)}
        onProductsOwnership={(next) => onUpdate("products_ownership", next)}
        productsOther={data.products_other}
        productsOwned={data.products_owned}
        productsOwnership={data.products_ownership}
      />
    );
  }

  if (stepId === "emergency") {
    return (
      <EmergencyContactStep
        altPhone={data.emergency_alt_phone}
        country={data.emergency_country}
        email={data.emergency_email}
        error={issueFor("emergency")}
        informed={data.emergency_informed}
        mobile={data.emergency_mobile}
        name={data.emergency_name}
        onAltPhone={(next) => onUpdate("emergency_alt_phone", next)}
        onCountry={(next) => onUpdate("emergency_country", next)}
        onEmail={(next) => onUpdate("emergency_email", next)}
        onInformed={(next) => onUpdate("emergency_informed", next)}
        onMobile={(next) => onUpdate("emergency_mobile", next)}
        onName={(next) => onUpdate("emergency_name", next)}
        onRelationship={(next) => onUpdate("emergency_relationship", next)}
        onRelationshipOther={(next) =>
          onUpdate("emergency_relationship_other", next)
        }
        onSafetyAck={(next) => onUpdate("safety_acknowledged", next)}
        relationship={data.emergency_relationship}
        relationshipOther={data.emergency_relationship_other}
        safetyAck={data.safety_acknowledged}
        successMessage={stepSuccess}
      />
    );
  }

  if (stepId === "agreements") {
    return (
      <AgreementsReviewStep
        acceptedKeys={data.agreement_keys}
        accuracyConfirmed={data.accuracy_confirmed}
        error={issueFor("agreements")}
        marketingConsent={data.marketing_consent}
        onAccuracyConfirmed={(next) => onUpdate("accuracy_confirmed", next)}
        onEditStep={(next) => onEditStep(next as StepId)}
        onMarketingConsent={(next) => onUpdate("marketing_consent", next)}
        onToggle={(key, next) => {
          const set = new Set(data.agreement_keys);
          if (next) set.add(key);
          else set.delete(key);
          onUpdate("agreement_keys", Array.from(set));
        }}
        summaryRows={STEPS.filter((step) => step.id !== "agreements").map(
          (step) => ({
            label: SUMMARY_LABELS[step.id as StepId] ?? step.label,
            status: isStepComplete(step.id, data)
              ? "Complete"
              : "Needs attention",
            stepId: step.id,
          }),
        )}
      />
    );
  }

  if (stepId === "photo") {
    return (
      <PhotoStep
        error={issueFor("headshot")}
        onFile={(file) => onFile("headshot", file)}
        onRemove={() => onRemove("headshot")}
        previewUrl={docPreviews.headshot?.url}
        progress={uploadingSlot === "headshot" ? uploadProgress : undefined}
        uploaded={Boolean(data.headshot_url)}
        uploading={uploadingSlot === "headshot"}
      />
    );
  }

  if (stepId === "about") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#1c133b]">Full name</p>
          <p
            className={cn(
              "flex min-h-11 w-full items-center rounded-xl px-3.5 text-[15px] text-[#291845]",
              ONBOARDING_FIELD_CLASS,
            )}
          >
            {data.full_name || "—"}
          </p>
          {issueFor("full_name") ? (
            <FieldError message={issueFor("full_name")!} />
          ) : null}
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-full shrink-0 sm:w-[17.5rem]">
            {askForPhone ? (
              <AuthPhoneField
                className={cn(ONBOARDING_FIELD_CLASS, "min-h-11 w-full")}
                error={
                  issueFor("phone")
                    ? { type: "manual", message: issueFor("phone") }
                    : undefined
                }
                htmlFor="onboarding-phone"
                nationalNumber={nationalFromPhone(data.phone)}
                onNationalNumberChange={(value) => {
                  const national = nationalFromPhone(value)
                    .replace(/[^\d\s]/g, "")
                    .replace(/^\s+/, "")
                    .replace(/\s{2,}/g, " ");
                  onUpdate("phone", storedPhone(national));
                }}
                required
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1c133b]">
                  Phone number
                </p>
                <p
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-xl px-3.5 text-[15px] text-[#291845]",
                    ONBOARDING_FIELD_CLASS,
                  )}
                >
                  <UkFlag className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px]" />
                  <span>{data.phone || "—"}</span>
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-1 justify-center sm:px-4">
            <div className="space-y-2 text-sm font-medium">
              <span className="block">Years of experience</span>
              <ExperienceStepper
                onChange={(years) => onUpdate("years_experience", years)}
                value={data.years_experience}
              />
            </div>
          </div>
        </div>
        <p className="text-xs leading-5 text-[#8b8798]">
          {askForPhone
            ? "Your name comes from your account. Change it later in "
            : "Name and phone come from your account. Change them later in "}
          <a
            className="font-medium text-[#6a45b8] hover:underline"
            href="/cleaner/profile"
          >
            Profile
          </a>
          .
        </p>
        <div className="space-y-1.5">
          <FormField
            htmlFor="onboarding-bio"
            label="Tell us about yourself"
            multiline
            plain
          >
            <textarea
              className={issueFor("bio") ? invalidControlClass : undefined}
              id="onboarding-bio"
              onChange={(event) => onUpdate("bio", event.target.value)}
              placeholder=" "
              value={data.bio}
            />
          </FormField>
          {issueFor("bio") ? (
            <FieldError message={issueFor("bio")!} />
          ) : null}
        </div>
      </div>
    );
  }

  if (stepId === "consent") {
    return (
      <ConsentStep
        accepted={data.location_tracking_consent_accepted}
        error={issueFor("consent")}
        onAccepted={(next) =>
          onUpdate("location_tracking_consent_accepted", next)
        }
      />
    );
  }

  return null;
}

function AppointmentPicker({
  error,
  onSchedule,
  selected,
  takenSlots,
}: {
  error?: string;
  onSchedule: (startsAt: string) => void;
  selected: string | null;
  takenSlots: string[];
}) {
  const days = upcomingInterviewDays(new Date(), takenSlots);
  const selectedDay =
    days.find((day) =>
      day.slots.some((slot) => sameMinute(slot.startsAt, selected)),
    ) ?? days[0];
  const [dayDate, setDayDate] = useState(selectedDay?.date ?? "");
  const day = days.find((item) => item.date === dayDate) ?? selectedDay;
  const [choice, setChoice] = useState<string | null>(selected);
  const booked = choice ?? selected;

  const morning = (day?.slots ?? []).filter(
    (slot) => Number(slot.label.slice(0, 2)) < 12,
  );
  const afternoon = (day?.slots ?? []).filter(
    (slot) => Number(slot.label.slice(0, 2)) >= 12,
  );

  const dayContext = day
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/London",
        weekday: "long",
      }).format(new Date(`${day.date}T12:00:00Z`))
    : "";

  function pickSlot(startsAt: string) {
    setChoice(startsAt);
    onSchedule(startsAt);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef]">
        <div className="space-y-8 p-5 sm:p-7">
          {days.length === 0 ? (
            <p className="text-sm text-[#8b8798]">
              No interview times are open right now. Check back shortly.
            </p>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-[#1c133b]">
                  Choose a day
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {days.map((item) => {
                    const active = item.date === day?.date;
                    const dayNum = Number(item.date.slice(8, 10));
                    const weekday = item.label.slice(0, 3);
                    return (
                      <button
                        className={cn(
                          "flex h-[4.25rem] w-[3.25rem] flex-col items-center justify-center rounded-xl border-2 text-center transition sm:h-[4.5rem] sm:w-14",
                          active
                            ? "border-[#312c79] bg-[#312c79] text-white"
                            : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                        )}
                        key={item.date}
                        onClick={() => setDayDate(item.date)}
                        type="button"
                      >
                        <span className="text-[11px] font-medium">
                          {weekday}
                        </span>
                        <span className="mt-0.5 text-lg font-semibold leading-none">
                          {dayNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1c133b]">
                    Choose a time
                  </p>
                  {dayContext ? (
                    <p className="text-xs font-medium text-[#8b8798]">
                      {dayContext}
                    </p>
                  ) : null}
                </div>

                {morning.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[#8b8798]">
                      Morning
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {morning.map((slot) => {
                        const active = booked
                          ? sameMinute(booked, slot.startsAt)
                          : false;
                        return (
                          <button
                            className={cn(
                              "min-w-[4.5rem] rounded-xl border-2 px-3 py-2 text-sm font-semibold transition",
                              active
                                ? "border-[#312c79] bg-[#312c79] text-white"
                                : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                            )}
                            key={slot.startsAt}
                            onClick={() => pickSlot(slot.startsAt)}
                            type="button"
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {afternoon.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[#8b8798]">
                      Afternoon
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {afternoon.map((slot) => {
                        const active = booked
                          ? sameMinute(booked, slot.startsAt)
                          : false;
                        return (
                          <button
                            className={cn(
                              "min-w-[4.5rem] rounded-xl border-2 px-3 py-2 text-sm font-semibold transition",
                              active
                                ? "border-[#312c79] bg-[#312c79] text-white"
                                : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                            )}
                            key={slot.startsAt}
                            onClick={() => pickSlot(slot.startsAt)}
                            type="button"
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
          {error ? <FieldError message={error} /> : null}
        </div>

        {booked ? (
          <div className="space-y-2 border-t-2 border-[#1c133b] bg-[#f3eee4] px-5 py-4 sm:px-7">
            <p className="inline-flex items-start gap-2 text-sm font-semibold text-[#1c133b]">
              <CalendarDays
                className="mt-0.5 h-4 w-4 shrink-0 text-[#312c79]"
                strokeWidth={2.5}
              />
              <span>
                Confirmed · {formatAppointmentSummary(booked)} ·{" "}
                {INTERVIEW_DURATION_MINUTES} min video call
              </span>
            </p>
            <p className="text-xs text-[#8b8798]">
              We’ll email the meeting link. You can change the slot before you
              submit.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConsentStep({
  accepted,
  error,
  onAccepted,
}: {
  accepted: boolean;
  error?: string;
  onAccepted: (next: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 text-[#1c133b]">
        <OnboardingCheckbox checked={accepted} onCheckedChange={onAccepted} />
        <span className="text-sm font-medium leading-6">
          I agree to GPS capture at check-in and check-out only. We do not track
          you otherwise.
        </span>
      </label>

      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

const IDENTITY_GUIDE_TIPS = [
  {
    body: "A valid UK passport or driving licence works best. National ID cards are fine if they show your photo and full name.",
    crossedOut: false,
    image: "/images/marketing/onboarding/id-tip-passport.jpg",
    title: "Accepted documents",
  },
  {
    body: "Don’t crop corners, cover the page with your fingers, or shoot with glare. Lay it flat and show the whole page clearly.",
    crossedOut: true,
    image: "/images/marketing/onboarding/id-tip-dont.jpg",
    title: "No crop or glare",
  },
] as const;

function IdentityStep({
  idUrls,
  issue,
  onFile,
  onRemove,
  pagePreviews,
  uploadProgress,
  uploadingSlot,
}: {
  idUrls: string[];
  issue?: string;
  onFile: (file: File, slot: number) => void;
  onRemove: (slot: number) => void;
  pagePreviews: Partial<
    Record<string, { isPdf?: boolean; url?: string }>
  >;
  uploadProgress: number;
  uploadingSlot: string | null;
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const pages = idUrls.filter(Boolean);
  const sideLabel = (index: number) =>
    index === 0 ? "Front" : index === 1 ? "Back" : `Page ${index + 1}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
          onClick={() => setGuideOpen(true)}
          type="button"
        >
          ID tips
        </button>
      </div>
      <p className="text-xs leading-5 text-[#8b8798]">
        Passport photo page is usually enough. For a driving licence or BRP,
        add front and back.
      </p>
      <DocumentUpload
        error={issue}
        files={pages.map((url, index) => {
          const slotKey = `id:${index}`;
          const preview = pagePreviews[slotKey];
          const nameFromPreview = preview?.url
            ? preview.url.split("/").filter(Boolean).pop()
            : null;
          const nameFromStored = url.split("/").filter(Boolean).pop();
          const rawName = nameFromPreview || nameFromStored || "";
          let fileName = sideLabel(index);
          try {
            const decoded = decodeURIComponent(rawName);
            if (decoded) fileName = `${sideLabel(index)} · ${decoded}`;
          } catch {
            if (rawName) fileName = `${sideLabel(index)} · ${rawName}`;
          }
          const isUploadingHere = uploadingSlot === slotKey;
          return {
            key: slotKey,
            name: fileName,
            onRemove: () => onRemove(index),
            progress: isUploadingHere ? uploadProgress : undefined,
            uploading: isUploadingHere,
          };
        })}
        label="Identity document"
        maxFiles={MAX_ID_DOCUMENT_PAGES}
        onFile={(file) => {
          if (pages.length >= MAX_ID_DOCUMENT_PAGES) return;
          onFile(file, pages.length);
        }}
        progress={
          uploadingSlot === `id:${pages.length}` ? uploadProgress : undefined
        }
        uploaded={pages.length > 0}
        uploading={uploadingSlot === `id:${pages.length}`}
      />
      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-2xl border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)] sm:max-w-3xl"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="What we need so we can verify your identity quickly."
          onClose={() => setGuideOpen(false)}
          title="Identity document tips"
        >
          <div className={guideTipGridClass(IDENTITY_GUIDE_TIPS.length)}>
            {IDENTITY_GUIDE_TIPS.map((tip) => (
              <article
                className="overflow-hidden rounded-2xl border border-[#e8e0d0] bg-[#f3eee4]"
                key={tip.title}
              >
                <div className={GUIDE_TIP_MEDIA_CLASS}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local stock tip photos; next/image optimizer 500s on these */}
                  <img
                    alt=""
                    className={`h-full w-full object-cover object-center ${
                      tip.crossedOut ? "opacity-80" : ""
                    }`}
                    src={tip.image}
                  />
                  {tip.crossedOut ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#291845]/25"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#d4694a] bg-white/90 text-[#d4694a] shadow-sm">
                        <X className="h-9 w-9" strokeWidth={3} />
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1.5 p-3.5">
                  <h3 className="text-sm font-semibold text-[#291845]">
                    {tip.title}
                  </h3>
                  <p className="text-xs leading-5 text-[#5a5470]">{tip.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              className="h-11 rounded-full border-2 border-[#1c133b] bg-[#1c133b] px-6 font-semibold text-white hover:border-[#312c79] hover:bg-[#312c79]"
              onClick={() => setGuideOpen(false)}
              type="button"
            >
              Got it
            </Button>
          </div>
        </AppModal>
      ) : null}
    </div>
  );
}

const COVERAGE_GUIDE_TIPS = [
  {
    body: `Pick the Birmingham district you usually start from — that becomes your home base and the centre of the map. You can add up to ${MAX_WORKING_DISTRICTS} districts in total from the same list.`,
    title: "Districts",
  },
  {
    body: `Set how far you’re willing to travel from your home base, up to ${MAX_RADIUS_MILES} miles. Jobs outside that circle won’t be offered unless they’re in an extra district you added.`,
    title: "Working radius",
  },
] as const;

function HomeDistrictsPicker({
  atLimit,
  error,
  onAdd,
  selected,
}: {
  atLimit: boolean;
  error?: boolean;
  onAdd: (prefix: string) => void;
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedSet = new Set(selected);
  const available = COVERAGE_SHORTCUTS.filter(
    (item) => !selectedSet.has(item.prefix),
  );
  const normalisedQuery = query.trim().toLowerCase();
  const filtered = normalisedQuery
    ? available.filter(
        (item) =>
          item.label.toLowerCase().includes(normalisedQuery) ||
          item.prefix.toLowerCase().includes(normalisedQuery),
      )
    : available;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    window.requestAnimationFrame(() => searchRef.current?.focus());
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#1c133b]",
          ONBOARDING_FIELD_CLASS,
          error ? invalidControlClass : undefined,
          open && "ring-2 ring-[#1c133b]",
        )}
        disabled={atLimit}
        onClick={() => {
          if (atLimit) return;
          setOpen((current) => !current);
        }}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-2 text-[#8b8798]">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span className="truncate">
            {atLimit
              ? `Maximum ${MAX_WORKING_DISTRICTS} districts`
              : selected.length === 0
                ? "Choose your home district…"
                : "Add another district…"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#1c133b] transition",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
        />
      </button>
      {open && !atLimit ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] shadow-[0_18px_40px_rgba(28,19,59,0.14)]">
          <div className="flex items-center gap-2 border-b border-[#e8e0d0] px-3 py-2">
            <Search
              className="h-4 w-4 shrink-0 text-[#8b8798]"
              strokeWidth={2.5}
            />
            <input
              className="h-9 w-full bg-transparent text-sm text-[#1c133b] outline-none placeholder:text-[#8b8798]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search districts…"
              ref={searchRef}
              type="search"
              value={query}
            />
          </div>
          <ul className="max-h-56 overflow-auto p-1.5" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-[#8b8798]">
                {available.length === 0
                  ? "Every available district is already added."
                  : "No districts match that search."}
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.prefix}>
                  <button
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
                    aria-selected={false}
                    onClick={() => {
                      onAdd(item.prefix);
                      setQuery("");
                      setOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {item.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CoverageStep({
  areas,
  error,
  homeBase,
  homeBaseLat,
  homeBaseLng,
  onAreas,
  onHomeBase,
  onHomeCoords,
  onRadiusMiles,
  radiusMiles,
}: {
  areas: string[];
  error?: string;
  homeBase: string;
  homeBaseLat: number | null;
  homeBaseLng: number | null;
  onAreas: (next: string[]) => void;
  onHomeBase: (next: string) => void;
  onHomeCoords: (lat: number | null, lng: number | null) => void;
  onRadiusMiles: (next: number) => void;
  radiusMiles: number;
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const miles = Math.min(
    MAX_RADIUS_MILES,
    Math.max(1, Math.round(radiusMiles) || DEFAULT_RADIUS_MILES),
  );
  const homePrefix = ukOutwardCode(homeBase);
  const extras = areas
    .map((item) => ukOutwardCode(item))
    .filter((item) => item && item !== homePrefix);
  const selectedDistricts = homePrefix ? [homePrefix, ...extras] : extras;
  const mapCenter =
    homeBaseLat != null && homeBaseLng != null
      ? { lat: homeBaseLat, lng: homeBaseLng }
      : BIRMINGHAM_CENTER;
  const mapReady = homeBaseLat != null && homeBaseLng != null;

  useEffect(() => {
    const query = homeBase.trim();
    if (query.length < 2) {
      onHomeCoords(null, null);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void (async () => {
        setGeocoding(true);
        try {
          const coords = await geocodeUkPostcode(query);
          if (controller.signal.aborted) return;
          if (coords) onHomeCoords(coords.lat, coords.lng);
          else onHomeCoords(null, null);
        } finally {
          if (!controller.signal.aborted) setGeocoding(false);
        }
      })();
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geocode when home base changes
  }, [homeBase]);

  function applyDistricts(next: string[]) {
    const unique = Array.from(
      new Set(next.map((item) => ukOutwardCode(item)).filter(Boolean)),
    ).slice(0, MAX_WORKING_DISTRICTS);
    onHomeBase(unique[0] ?? "");
    onAreas(unique.slice(1));
  }

  function addDistrict(prefix: string) {
    const code = ukOutwardCode(prefix);
    if (!code || selectedDistricts.includes(code)) return;
    if (selectedDistricts.length >= MAX_WORKING_DISTRICTS) return;
    applyDistricts([...selectedDistricts, code]);
  }

  function removeDistrict(prefix: string) {
    applyDistricts(selectedDistricts.filter((item) => item !== prefix));
  }

  function makeHome(prefix: string) {
    if (prefix === homePrefix) return;
    applyDistricts([
      prefix,
      ...selectedDistricts.filter((item) => item !== prefix),
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
          onClick={() => setGuideOpen(true)}
          type="button"
        >
          Coverage tips
        </button>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
          <div className="grid min-w-0 grid-rows-[auto_1fr_auto] gap-2">
            <p className="text-sm font-medium text-[#291845]">Districts</p>
            <p className="text-xs leading-5 text-[#8b8798]">
              First pick is your home base. Up to {MAX_WORKING_DISTRICTS}{" "}
              districts.
            </p>
            <HomeDistrictsPicker
              atLimit={selectedDistricts.length >= MAX_WORKING_DISTRICTS}
              error={error?.toLowerCase().includes("home")}
              onAdd={addDistrict}
              selected={selectedDistricts}
            />
          </div>
          <div className="grid min-w-0 grid-rows-[auto_1fr_auto] gap-2">
            <p className="text-sm font-medium text-[#291845]">Working radius</p>
            <p className="text-xs leading-5 text-[#8b8798]">
              Travel from home base — up to {MAX_RADIUS_MILES} miles.
            </p>
            <div className="flex h-11 items-center gap-3">
              <button
                aria-label="Decrease radius"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={miles <= 1}
                onClick={() => onRadiusMiles(miles - 1)}
                type="button"
              >
                <Minus className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <div className="min-w-[5.5rem] text-center">
                <p className="text-lg font-semibold leading-none tabular-nums text-[#291845]">
                  {miles}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#8b8798]">
                  {miles === 1 ? "mile" : "miles"}
                </p>
              </div>
              <button
                aria-label="Increase radius"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={miles >= MAX_RADIUS_MILES}
                onClick={() => onRadiusMiles(miles + 1)}
                type="button"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        {geocoding ? (
          <p className="-mt-4 text-xs text-[#8b8798]">
            Finding that area on the map…
          </p>
        ) : null}

        {selectedDistricts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedDistricts.map((prefix) => {
              const label =
                COVERAGE_SHORTCUTS.find((item) => item.prefix === prefix)
                  ?.label ?? prefix;
              const isHome = prefix === homePrefix;
              return (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold",
                    isHome
                      ? "border-[#312c79] bg-[#312c79] text-white"
                      : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b]",
                  )}
                  key={prefix}
                >
                  {isHome ? (
                    <span className="opacity-90">Home · {label}</span>
                  ) : (
                    <button
                      className="text-left"
                      onClick={() => makeHome(prefix)}
                      title="Set as home base"
                      type="button"
                    >
                      {label}
                    </button>
                  )}
                  <button
                    aria-label={`Remove ${label}`}
                    className={cn(
                      "rounded-full p-0.5 transition",
                      isHome ? "hover:bg-white/20" : "hover:bg-[#1c133b]/10",
                    )}
                    onClick={() => removeDistrict(prefix)}
                    type="button"
                  >
                    <X className="h-3 w-3" strokeWidth={2.75} />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <CoverageMap
          center={mapCenter}
          radiusMiles={miles}
          showCircle={mapReady}
        />
      </div>

      {error ? <FieldError message={error} /> : null}
      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-lg border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)]"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="A short guide to choosing areas you’ll actually cover."
          onClose={() => setGuideOpen(false)}
          title="How coverage areas work"
        >
          <ul className="mt-4 space-y-3">
            {COVERAGE_GUIDE_TIPS.map((tip) => (
              <li
                className="rounded-2xl border border-[#e8e0d0] bg-[#f3eee4] px-4 py-3"
                key={tip.title}
              >
                <p className="text-sm font-semibold text-[#1c133b]">
                  {tip.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#5a5470]">
                  {tip.body}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end">
            <Button
              className="h-11 rounded-full border-2 border-[#1c133b] bg-[#1c133b] px-6 font-semibold text-white hover:border-[#312c79] hover:bg-[#312c79]"
              onClick={() => setGuideOpen(false)}
              type="button"
            >
              Got it
            </Button>
          </div>
        </AppModal>
      ) : null}
    </div>
  );
}

function PhotoStep({
  error,
  onFile,
  onRemove,
  previewUrl,
  progress,
  uploaded,
  uploading,
}: {
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  previewUrl?: string;
  progress?: number;
  uploaded: boolean;
  uploading: boolean;
}) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
          onClick={() => setGuideOpen(true)}
          type="button"
        >
          Photo tips
        </button>
      </div>
      <DocumentUpload
        accept="image/*"
        error={error}
        label="Upload headshot"
        onFile={onFile}
        onRemove={onRemove}
        previewIsPdf={false}
        previewUrl={previewUrl}
        progress={progress}
        uploaded={uploaded}
        uploading={uploading}
      />
      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-2xl border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)] sm:max-w-3xl"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="A few friendly pointers for a photo customers will trust."
          onClose={() => setGuideOpen(false)}
          title="What makes a great profile photo"
        >
          <div className={guideTipGridClass(PHOTO_GUIDE_TIPS.length)}>
            {PHOTO_GUIDE_TIPS.map((tip) => (
              <article
                className="overflow-hidden rounded-2xl border border-[#e8e0d0] bg-[#f3eee4]"
                key={tip.title}
              >
                <div className={GUIDE_TIP_MEDIA_CLASS}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local stock tip photos; next/image optimizer 500s on these */}
                  <img
                    alt=""
                    className={`h-full w-full object-cover object-center ${
                      "zoomFace" in tip && tip.zoomFace
                        ? "scale-[1.55] object-[center_28%]"
                        : ""
                    } ${tip.crossedOut ? "opacity-80" : ""}`}
                    src={tip.image}
                  />
                  {tip.crossedOut ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#291845]/25"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#d4694a] bg-white/90 text-[#d4694a] shadow-sm">
                        <X className="h-9 w-9" strokeWidth={3} />
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1.5 p-3.5">
                  <h3 className="text-sm font-semibold text-[#291845]">
                    {tip.title}
                  </h3>
                  <p className="text-xs leading-5 text-[#5a5470]">{tip.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              className="h-11 rounded-full border-2 border-[#1c133b] bg-[#1c133b] px-6 font-semibold text-white hover:bg-[#312c79] hover:border-[#312c79]"
              onClick={() => setGuideOpen(false)}
              type="button"
            >
              Got it
            </Button>
          </div>
        </AppModal>
      ) : null}
    </div>
  );
}

function formatAppointmentSummary(startsAt: string) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return startsAt;
  const end = new Date(start.getTime() + INTERVIEW_DURATION_MINUTES * 60_000);
  const dayPart = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
    weekday: "long",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
  return `${dayPart}, ${time.format(start)} to ${time.format(end)}`;
}

function sameMinute(left: string | null, right: string | null) {
  if (!left || !right) return false;
  return (
    Math.floor(new Date(left).getTime() / 60_000) ===
    Math.floor(new Date(right).getTime() / 60_000)
  );
}

const EXPERIENCE_MAX = 60;

function ExperienceStepper({
  onChange,
  value,
}: {
  onChange: (years: number) => void;
  value: number;
}) {
  const years = Number.isFinite(value)
    ? Math.min(EXPERIENCE_MAX, Math.max(0, Math.round(value)))
    : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        aria-label="Decrease years of experience"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        disabled={years <= 0}
        onClick={() => onChange(years - 1)}
        type="button"
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <div className="min-w-[4.5rem] text-center">
        <p className="text-lg font-semibold tabular-nums tracking-[-0.02em] text-[#291845]">
          {years}
        </p>
        <p className="text-xs font-medium text-[#8b8798]">
          {years === 1 ? "year" : "years"}
        </p>
      </div>
      <button
        aria-label="Increase years of experience"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        disabled={years >= EXPERIENCE_MAX}
        onClick={() => onChange(years + 1)}
        type="button"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

const HOURS_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const; // Mon → Sun
const HOURS_DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOURS_WEEKDAYS = new Set([1, 2, 3, 4, 5]);
const HOURS_WEEKENDS = new Set([0, 6]);
/** Match customer bookable window (07:00–23:00). */
const WORKING_HOURS_MIN = formatWindowMinutes(DAY_WINDOW_START_MINUTES);
const WORKING_HOURS_MAX = formatWindowMinutes(DAY_WINDOW_END_MINUTES);
const DEFAULT_START = WORKING_HOURS_MIN;
const DEFAULT_END = WORKING_HOURS_MAX;

function formatWindowMinutes(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function clampWorkingTime(value: string) {
  const time = value.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) return WORKING_HOURS_MIN;
  if (time < WORKING_HOURS_MIN) return WORKING_HOURS_MIN;
  if (time > WORKING_HOURS_MAX) return WORKING_HOURS_MAX;
  return time;
}

function isWithinWorkingWindow(start: string, end: string) {
  return (
    start >= WORKING_HOURS_MIN &&
    end <= WORKING_HOURS_MAX &&
    start < end
  );
}

function HoursPicker({
  error,
  onChange,
  onPreferredHours,
  preferredHoursBand,
  value,
}: {
  error?: string;
  onChange: (next: AvailabilityDay[]) => void;
  onPreferredHours: (next: string) => void;
  preferredHoursBand: string;
  value: AvailabilityDay[];
}) {
  const active = value.filter((day) => day.is_available);
  const [secondOpen, setSecondOpen] = useState<number[]>(() =>
    value
      .filter((day) => day.is_available && (day.start_time_2 || day.end_time_2))
      .map((day) => day.day_of_week),
  );

  function defaultTimes() {
    const sample = active[0];
    return {
      end: clampWorkingTime(sample?.end_time || DEFAULT_END),
      start: clampWorkingTime(sample?.start_time || DEFAULT_START),
    };
  }

  function patchDays(
    updater: (day: AvailabilityDay, index: number) => AvailabilityDay,
  ) {
    onChange(value.map((day, index) => updater(day, index)));
  }

  function toggleDay(dayOfWeek: number) {
    const { end, start } = defaultTimes();
    patchDays((day) => {
      if (day.day_of_week !== dayOfWeek) return day;
      if (day.is_available) {
        setSecondOpen((current) => current.filter((item) => item !== dayOfWeek));
        return { ...day, is_available: false };
      }
      return {
        ...day,
        end_time: end,
        end_time_2: "",
        is_available: true,
        start_time: start,
        start_time_2: "",
      };
    });
  }

  function applyPreset(preset: "weekdays" | "weekends" | "all") {
    const selected =
      preset === "weekdays"
        ? HOURS_WEEKDAYS
        : preset === "weekends"
          ? HOURS_WEEKENDS
          : null;
    const { end, start } = defaultTimes();
    patchDays((day) => {
      const on = selected ? selected.has(day.day_of_week) : true;
      if (!on) return { ...day, is_available: false };
      if (day.is_available) return { ...day, is_available: true };
      return {
        ...day,
        end_time: end,
        end_time_2: "",
        is_available: true,
        start_time: start,
        start_time_2: "",
      };
    });
  }

  function setDayHours(dayOfWeek: number, start: string, end: string) {
    patchDays((day) =>
      day.day_of_week === dayOfWeek
        ? {
            ...day,
            end_time: clampWorkingTime(end),
            start_time: clampWorkingTime(start),
          }
        : day,
    );
  }

  function setDaySecond(dayOfWeek: number, start: string, end: string) {
    patchDays((day) =>
      day.day_of_week === dayOfWeek
        ? {
            ...day,
            end_time_2: end ? clampWorkingTime(end) : "",
            start_time_2: start ? clampWorkingTime(start) : "",
          }
        : day,
    );
  }

  function removeDaySecond(dayOfWeek: number) {
    setSecondOpen((current) => current.filter((item) => item !== dayOfWeek));
    setDaySecond(dayOfWeek, "", "");
  }

  const presets = [
    {
      id: "weekdays" as const,
      label: "Weekdays",
      active:
        active.length === 5 &&
        active.every((day) => HOURS_WEEKDAYS.has(day.day_of_week)),
    },
    {
      id: "weekends" as const,
      label: "Weekends",
      active:
        active.length === 2 &&
        active.every((day) => HOURS_WEEKENDS.has(day.day_of_week)),
    },
    {
      id: "all" as const,
      label: "All days",
      active: active.length === 7,
    },
  ];

  return (
    <div className="space-y-6">
      {error ? <FieldError message={error} /> : null}

      <div>
        <p className="mb-3 text-sm font-medium text-[#291845]">
          Which days are you available?
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition",
                preset.active
                  ? "border-[#312c79] bg-[#312c79] text-white"
                  : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
              )}
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {HOURS_DAY_ORDER.map((dayOfWeek) => {
            const day = value.find((item) => item.day_of_week === dayOfWeek);
            const selected = Boolean(day?.is_available);
            const label = HOURS_DAY_SHORT[dayOfWeek];
            return (
              <button
                aria-label={days[dayOfWeek]}
                aria-pressed={selected}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-[10px] font-semibold transition sm:rounded-2xl sm:text-xs",
                  selected
                    ? "border-[#312c79] bg-[#312c79] text-white"
                    : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                )}
                key={dayOfWeek}
                onClick={() => toggleDay(dayOfWeek)}
                type="button"
              >
                <span className="sm:hidden">{label.slice(0, 1)}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#291845]">
          Start and end times
        </p>
        {active.length === 0 ? (
          <p className="text-sm text-[#8b8798]">
            Select at least one day to set your hours.
          </p>
        ) : (
          HOURS_DAY_ORDER.map((dayOfWeek) => {
            const day = value.find((item) => item.day_of_week === dayOfWeek);
            if (!day?.is_available) return null;
            const showSecond =
              secondOpen.includes(dayOfWeek) ||
              Boolean(day.start_time_2 || day.end_time_2);
            return (
              <div className="space-y-2" key={dayOfWeek}>
                <div className="grid grid-cols-[minmax(4.5rem,auto)_1fr_auto_1fr] items-center gap-2">
                  <span className="text-sm font-semibold text-[#291845]">
                    {days[dayOfWeek]}
                  </span>
                  <Input
                    aria-label={`${days[dayOfWeek]} start`}
                    className={ONBOARDING_FIELD_CLASS}
                    max={WORKING_HOURS_MAX}
                    min={WORKING_HOURS_MIN}
                    onChange={(event) =>
                      setDayHours(dayOfWeek, event.target.value, day.end_time)
                    }
                    type="time"
                    value={day.start_time}
                  />
                  <span className="text-sm text-[#8b8798]">to</span>
                  <Input
                    aria-label={`${days[dayOfWeek]} end`}
                    className={ONBOARDING_FIELD_CLASS}
                    max={WORKING_HOURS_MAX}
                    min={WORKING_HOURS_MIN}
                    onChange={(event) =>
                      setDayHours(
                        dayOfWeek,
                        day.start_time,
                        event.target.value,
                      )
                    }
                    type="time"
                    value={day.end_time}
                  />
                </div>
                {showSecond ? (
                  <div className="grid grid-cols-[minmax(4.5rem,auto)_1fr_auto_1fr_auto] items-center gap-2">
                    <span className="text-xs font-medium text-[#8b8798]">
                      and
                    </span>
                    <Input
                      aria-label={`${days[dayOfWeek]} second start`}
                      className={ONBOARDING_FIELD_CLASS}
                      max={WORKING_HOURS_MAX}
                      min={WORKING_HOURS_MIN}
                      onChange={(event) =>
                        setDaySecond(
                          dayOfWeek,
                          event.target.value,
                          day.end_time_2 ?? "",
                        )
                      }
                      type="time"
                      value={day.start_time_2 ?? ""}
                    />
                    <span className="text-sm text-[#8b8798]">to</span>
                    <Input
                      aria-label={`${days[dayOfWeek]} second end`}
                      className={ONBOARDING_FIELD_CLASS}
                      max={WORKING_HOURS_MAX}
                      min={WORKING_HOURS_MIN}
                      onChange={(event) =>
                        setDaySecond(
                          dayOfWeek,
                          day.start_time_2 ?? "",
                          event.target.value,
                        )
                      }
                      type="time"
                      value={day.end_time_2 ?? ""}
                    />
                    <button
                      aria-label={`Remove ${days[dayOfWeek]} second window`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1c133b] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
                      onClick={() => removeDaySecond(dayOfWeek)}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="text-xs font-semibold text-[#312c79] underline-offset-2 hover:underline"
                    onClick={() =>
                      setSecondOpen((current) => [...current, dayOfWeek])
                    }
                    type="button"
                  >
                    + Add a second window
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-3 border-t border-[#e8e0d0] pt-8">
        <div className="mb-1">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-[#1c133b]">
            How many hours would you prefer to work per week?
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#5a5470]">
            Guides how much work we typically offer each week.
          </p>
        </div>
        <ChoicePills
          label="Preferred hours per week"
          onChange={onPreferredHours}
          options={[...PREFERRED_HOURS_BANDS]}
          value={preferredHoursBand || null}
        />
      </div>
    </div>
  );
}

function ServicesPicker({
  error,
  onChange,
  selected,
}: {
  error?: string;
  onChange: (next: string[]) => void;
  selected: string[];
}) {
  const selectedSet = new Set(selected);
  const categories = MAIN_SERVICE_CATEGORIES.map((value) => {
    const definition = categoryDefinition(value);
    return {
      icon: definition.icon,
      label: MAIN_CATEGORY_LABEL[value],
      services: servicesForMainCategory(value, selected),
      value,
    };
  }).filter((category) => category.services.length > 0);

  function toggleService(value: ServiceType, checked: boolean) {
    if (checked) {
      if (selectedSet.has(value)) return;
      onChange([...selected, value]);
      return;
    }
    onChange(selected.filter((item) => item !== value));
  }

  function toggleCategory(values: ServiceType[], selectAll: boolean) {
    if (selectAll) {
      const next = new Set(selected);
      for (const value of values) next.add(value);
      onChange(Array.from(next));
      return;
    }
    const drop = new Set<string>(values);
    onChange(selected.filter((item) => !drop.has(item)));
  }

  return (
    <div className="space-y-6">
      {error ? <FieldError message={error} /> : null}
      {categories.map((category) => {
        const values = category.services.map((service) => service.value);
        const allSelected = values.every((value) => selectedSet.has(value));
        const CategoryIcon = category.icon;
        const theme = SERVICE_CATEGORY_THEME[category.value];

        return (
          <section className="space-y-3" key={category.value}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: theme.wash,
                    color: theme.accent,
                  }}
                >
                  <CategoryIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: theme.accent }}
                >
                  {category.label}
                </h3>
              </div>
              <button
                className="shrink-0 text-xs font-semibold transition hover:opacity-80"
                onClick={() => toggleCategory(values, !allSelected)}
                style={{ color: theme.accent }}
                type="button"
              >
                {allSelected ? "Clear" : "Select all"}
              </button>
            </div>
            <div className="grid gap-2">
              {category.services.map((service) => {
                const isSelected = selectedSet.has(service.value);
                const ServiceIcon = service.icon;
                return (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm text-[#1c133b] transition hover:bg-[#fbf9ff] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#312c79]/30"
                    key={service.value}
                  >
                    <OnboardingCheckbox
                      checked={isSelected}
                      className="mt-0"
                      onCheckedChange={(next) =>
                        toggleService(service.value, next)
                      }
                    />
                    <ServiceIcon
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-[#8b8798]"
                      strokeWidth={2}
                    />
                    <span className="font-medium">{service.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function toIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sanitizeExamAnswers(
  value: OnboardingData["skills_exam_answers"] | undefined,
) {
  const next: Record<string, SkillsExamAnswer> = {};
  if (!value || typeof value !== "object") return next;
  for (const [key, answer] of Object.entries(value)) {
    if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer <= 3) {
      next[key] = answer;
    } else if (Array.isArray(answer)) {
      const indexes = answer.filter(
        (item): item is number =>
          typeof item === "number" && Number.isInteger(item) && item >= 0 && item <= 3,
      );
      if (indexes.length > 0) next[key] = indexes;
    }
  }
  return next;
}

function stringList(value: unknown) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function sanitizeOnboardingData(value: OnboardingData): OnboardingData {
  const utrPath =
    value.utr_path === "have" ||
    value.utr_path === "none" ||
    value.utr_path === "unsure" ||
    value.utr_path === "waiting"
      ? value.utr_path
      : null;
  const dbsPath =
    value.dbs_path === "have" ||
    value.dbs_path === "apply" ||
    value.dbs_path === "waiting"
      ? value.dbs_path
      : null;
  const insurancePath =
    value.insurance_path === "have" ||
    value.insurance_path === "none" ||
    value.insurance_path === "unsure"
      ? value.insurance_path
      : null;

  const trainingPath =
    value.training_path === "yes" || value.training_path === "no"
      ? value.training_path
      : "";

  return {
    ...value,
    accuracy_confirmed: Boolean(value.accuracy_confirmed),
    agreement_keys: stringList(value.agreement_keys),
    cleaning_skills_other: String(value.cleaning_skills_other ?? "").trim(),
    emergency_relationship_other: String(
      value.emergency_relationship_other ?? "",
    ).trim(),
    equipment_other: String(value.equipment_other ?? "").trim(),
    insurance_activity_confirmed: Boolean(value.insurance_activity_confirmed),
    insurance_insured_name: String(value.insurance_insured_name ?? "").trim(),
    marketing_consent: Boolean(value.marketing_consent),
    ppe_other: "",
    preferred_hours_band: String(value.preferred_hours_band ?? "").trim(),
    products_other: String(value.products_other ?? "").trim(),
    reference_company: String(value.reference_company ?? "").trim(),
    reference_contact_ok: Boolean(value.reference_contact_ok),
    reference_email: String(value.reference_email ?? "").trim(),
    reference_name: String(value.reference_name ?? "").trim(),
    reference_phone: String(value.reference_phone ?? "").trim(),
    reference_relationship: String(value.reference_relationship ?? "").trim(),
    specialised_other: String(value.specialised_other ?? "").trim(),
    training_certificate_url: String(
      value.training_certificate_url ?? "",
    ).trim(),
    training_completed: stringList(value.training_completed),
    training_path: trainingPath,
    interview_scheduled_at: toIso(value.interview_scheduled_at),
    availability: (value.availability ?? []).map((day) => ({
      day_of_week: Number(day.day_of_week),
      end_time: String(day.end_time ?? "").trim(),
      end_time_2: String(day.end_time_2 ?? "").trim(),
      is_available: Boolean(day.is_available),
      start_time: String(day.start_time ?? "").trim(),
      start_time_2: String(day.start_time_2 ?? "").trim(),
    })),
    bio: String(value.bio ?? "").trim(),
    booking_preferences: stringList(value.booking_preferences),
    can_transport_equipment: (() => {
      const next = String(value.can_transport_equipment ?? "").trim();
      return next === "yes" || next === "no" ? next : "";
    })(),
    cleaning_skills: stringList(value.cleaning_skills),
    dbs_certificate_number: String(value.dbs_certificate_number ?? "").trim(),
    dbs_document_url: String(value.dbs_document_url ?? "").trim(),
    dbs_issued_on: String(value.dbs_issued_on ?? "").trim(),
    dbs_path: dbsPath,
    emergency_alt_phone: String(value.emergency_alt_phone ?? "").trim(),
    emergency_country: String(value.emergency_country ?? "").trim() || "United Kingdom",
    emergency_email: String(value.emergency_email ?? "").trim(),
    emergency_informed: String(value.emergency_informed ?? "").trim(),
    emergency_mobile: String(value.emergency_mobile ?? "").trim(),
    emergency_name: String(value.emergency_name ?? "").trim(),
    emergency_relationship: String(value.emergency_relationship ?? "").trim(),
    equipment_condition: "",
    equipment_owned: stringList(value.equipment_owned),
    equipment_ownership: String(value.equipment_ownership ?? "").trim(),
    equipment_transport: "",
    experience_band: String(value.experience_band ?? "").trim(),
    full_name: String(value.full_name ?? "").trim(),
    headshot_url: String(value.headshot_url ?? "").trim(),
    id_document_url: String(value.id_document_url ?? "").trim(),
    insurance_certificate_url: String(
      value.insurance_certificate_url ?? "",
    ).trim(),
    insurance_cover_amount: String(value.insurance_cover_amount ?? "").trim(),
    insurance_expiry_date: String(value.insurance_expiry_date ?? "").trim(),
    insurance_path: insurancePath,
    insurance_policy_number: String(value.insurance_policy_number ?? "").trim(),
    insurance_provider: String(value.insurance_provider ?? "").trim(),
    location_tracking_consent_accepted: Boolean(
      value.location_tracking_consent_accepted,
    ),
    location_tracking_consent_version: String(
      value.location_tracking_consent_version ??
        "cleaner-location-consent-v1",
    ).trim(),
    payout_preference:
      value.payout_preference === "monthly" ? "monthly" : "weekly",
    phone: String(value.phone ?? "").trim(),
    ppe_owned: [],
    prior_work_duration: String(value.prior_work_duration ?? "").trim(),
    prior_work_employer: String(value.prior_work_employer ?? "").trim(),
    prior_work_summary: String(value.prior_work_summary ?? "").trim(),
    prior_work_type: String(value.prior_work_type ?? "").trim(),
    products_owned: stringList(value.products_owned),
    products_ownership: String(value.products_ownership ?? "").trim(),
    safety_acknowledged: Boolean(value.safety_acknowledged),
    services: (value.services ?? [])
      .map((service) => service.trim())
      .filter(Boolean),
    skills_exam_answers: sanitizeExamAnswers(value.skills_exam_answers),
    specialised_equipment: stringList(value.specialised_equipment),
    specialised_training: String(value.specialised_training ?? "").trim(),
    training_agreements: CHARTER_AGREEMENTS.map(
      (_, index) => Boolean(value.training_agreements?.[index]),
    ),
    transport_mode: String(value.transport_mode ?? "").trim(),
    utr_clarity_confirmed: Boolean(value.utr_clarity_confirmed),
    utr_document_url: String(value.utr_document_url ?? "").trim(),
    utr_number: String(value.utr_number ?? "")
      .replace(/\D/g, "")
      .slice(0, 10),
    utr_path: utrPath,
    verification_flags:
      value.verification_flags &&
      typeof value.verification_flags === "object" &&
      !Array.isArray(value.verification_flags)
        ? { ...value.verification_flags }
        : {},
    home_base: String(value.home_base ?? "").trim().toUpperCase(),
    home_base_lat:
      typeof value.home_base_lat === "number" &&
      Number.isFinite(value.home_base_lat)
        ? value.home_base_lat
        : null,
    home_base_lng:
      typeof value.home_base_lng === "number" &&
      Number.isFinite(value.home_base_lng)
        ? value.home_base_lng
        : null,
    working_areas: (value.working_areas ?? [])
      .map((area) => ukOutwardCode(area))
      .filter(Boolean)
      .slice(0, Math.max(0, MAX_WORKING_DISTRICTS - 1)),
    working_radius_miles: (() => {
      const miles = Number(value.working_radius_miles);
      if (!Number.isFinite(miles)) return DEFAULT_RADIUS_MILES;
      return Math.min(MAX_RADIUS_MILES, Math.max(1, Math.round(miles)));
    })(),
    years_experience: Number.isFinite(value.years_experience)
      ? Math.min(60, Math.max(0, Math.round(Number(value.years_experience))))
      : 0,
  };
}

function validateStep(stepId: StepId, value: OnboardingData): FieldIssue | null {
  const data = sanitizeOnboardingData(value);
  const issue = (field: string, message: string): FieldIssue => ({
    field,
    message,
  });

  if (stepId === "appointment" && !data.interview_scheduled_at) {
    return issue("slot", "Choose a time for your appointment.");
  }

  if (stepId === "services" && data.services.length === 0) {
    return issue("services", "Select at least one service you offer.");
  }

  if (stepId === "hours") {
    const availableDays = data.availability.filter((day) => day.is_available);
    if (availableDays.length === 0) {
      return issue("hours", "Choose at least one day you are available.");
    }
    if (!data.preferred_hours_band) {
      return issue(
        "preferred_hours",
        "Choose how many hours you’d prefer to work per week.",
      );
    }
    if (availableDays.some((day) => !day.start_time || !day.end_time)) {
      return issue("hours", "Set a start and end time for each available day.");
    }
    if (availableDays.some((day) => day.start_time >= day.end_time)) {
      return issue(
        "hours",
        "Availability end time must be later than start time.",
      );
    }
    if (
      availableDays.some(
        (day) => !isWithinWorkingWindow(day.start_time, day.end_time),
      )
    ) {
      return issue(
        "hours",
        `Set hours between ${WORKING_HOURS_MIN} and ${WORKING_HOURS_MAX}.`,
      );
    }
    for (const day of availableDays) {
      const start2 = day.start_time_2 ?? "";
      const end2 = day.end_time_2 ?? "";
      if (!start2 && !end2) continue;
      if (!start2 || !end2) {
        return issue(
          "hours",
          "Finish or remove the second time window on each day.",
        );
      }
      if (!isWithinWorkingWindow(start2, end2)) {
        return issue(
          "hours",
          `Set second windows between ${WORKING_HOURS_MIN} and ${WORKING_HOURS_MAX}, with the end after the start.`,
        );
      }
      if (start2 < day.end_time) {
        return issue(
          "hours",
          "A second time window must start after your first one ends.",
        );
      }
    }
  }

  if (stepId === "coverage") {
    if (ukOutwardCode(data.home_base).length < 2) {
      return issue(
        "home_base",
        "Enter your home postcode or area, for example B15.",
      );
    }
    {
      const home = ukOutwardCode(data.home_base);
      const total = new Set(
        [home, ...data.working_areas.map((item) => ukOutwardCode(item))].filter(
          Boolean,
        ),
      ).size;
      if (total > MAX_WORKING_DISTRICTS) {
        return issue(
          "areas",
          `Choose up to ${MAX_WORKING_DISTRICTS} districts in total.`,
        );
      }
    }
    if (
      data.working_radius_miles < 1 ||
      data.working_radius_miles > MAX_RADIUS_MILES
    ) {
      return issue(
        "radius",
        `Choose a working radius between 1 and ${MAX_RADIUS_MILES} miles.`,
      );
    }
    {
      const travel = parseTransportModes(data.transport_mode);
      if (travel.modes.length === 0) {
        return issue(
          "transport",
          "Select at least one way you usually travel to cleaning jobs.",
        );
      }
      if (travel.modes.includes("other") && travel.otherText.length < 2) {
        return issue(
          "transport",
          "Describe how else you usually travel to cleaning jobs.",
        );
      }
      if (
        data.can_transport_equipment !== "yes" &&
        data.can_transport_equipment !== "no"
      ) {
        return issue(
          "transport",
          "Tell us whether you can travel with cleaning equipment when required.",
        );
      }
    }
  }

  if (stepId === "quiz") {
    for (const question of SKILLS_EXAM_QUESTIONS) {
      if (!answerIsComplete(question, data.skills_exam_answers[question.id])) {
        return issue("quiz", "Answer every question in the online training.");
      }
    }
    if (!data.training_agreements.every(Boolean)) {
      return issue("quiz", "Tick every agreement on the Mundoria Pro charter.");
    }
    const exam = scoreSkillsExam(data.skills_exam_answers);
    if (!exam.passed) {
      return issue(
        "quiz",
        `You scored ${exam.score}/${exam.total}. You need ${SKILLS_EXAM_PASS_SCORE} or more. Review and try again.`,
      );
    }
  }

  if (stepId === "utr") {
    if (!data.utr_path) {
      return issue("utr", "Choose whether you already have a UTR.");
    }
    if (data.utr_path === "have") {
      if (!isValidUtr(data.utr_number)) {
        return issue("utr", "Enter your 10-digit UTR number.");
      }
      if (!data.utr_document_url) {
        return issue("utr", "Upload a document showing your UTR.");
      }
      if (!data.utr_clarity_confirmed) {
        return issue(
          "utr",
          "Confirm your name and UTR are clearly visible on the document.",
        );
      }
    }
  }

  if (stepId === "identity" && !hasAnyDocument(data.id_document_url)) {
    return issue("id", "Upload your government-issued ID.");
  }

  if (stepId === "dbs") {
    if (!data.dbs_path) {
      return issue("dbs", "Choose your DBS certificate status.");
    }
    if (data.dbs_path === "have") {
      if (!data.dbs_certificate_number.trim()) {
        return issue("dbs", "Enter your DBS certificate number.");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dbs_issued_on)) {
        return issue("dbs", "Enter the DBS issue date.");
      }
      if (!hasAnyDocument(data.dbs_document_url)) {
        return issue(
          "dbs",
          "Upload at least one page of your DBS certificate.",
        );
      }
    }
  }

  if (stepId === "insurance") {
    if (!data.insurance_path) {
      return issue("insurance", "Choose your insurance status.");
    }
    if (data.insurance_path === "have") {
      if (!data.insurance_provider) {
        return issue("insurance", "Enter your insurance provider.");
      }
      if (!data.insurance_policy_number) {
        return issue("insurance", "Enter your policy number.");
      }
      if (!data.insurance_insured_name) {
        return issue("insurance", "Enter the name on your insurance policy.");
      }
      if (!isAcceptableInsuranceCover(data.insurance_cover_amount)) {
        return issue(
          "insurance",
          data.insurance_cover_amount === "other" ||
            !data.insurance_cover_amount
            ? "Enter your cover amount (minimum £1 million)."
            : "Cover must be at least £1 million Public Liability.",
        );
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.insurance_expiry_date)) {
        return issue("insurance", "Enter the policy expiry date.");
      }
      if (isPastDateIso(data.insurance_expiry_date)) {
        return issue(
          "insurance",
          "Insurance expiry must be today or in the future.",
        );
      }
      if (!data.insurance_certificate_url) {
        return issue("insurance", "Upload your insurance certificate.");
      }
      if (!data.insurance_activity_confirmed) {
        return issue(
          "insurance",
          "Confirm your policy covers professional cleaning work.",
        );
      }
    }
  }

  if (stepId === "equipment") {
    if (!data.equipment_ownership) {
      return issue("equipment", "Tell us whether you have cleaning equipment.");
    }
    if (!data.products_ownership) {
      return issue("equipment", "Tell us whether you have cleaning products.");
    }
  }

  if (stepId === "emergency") {
    if (data.emergency_name.length < 2) {
      return issue("emergency", "Enter your emergency contact’s full name.");
    }
    if (!data.emergency_relationship) {
      return issue("emergency", "Choose their relationship to you.");
    }
    if (
      data.emergency_relationship === "other" &&
      data.emergency_relationship_other.length < 2
    ) {
      return issue("emergency", "Describe their relationship to you.");
    }
    if (data.emergency_mobile.length < 7) {
      return issue("emergency", "Enter a valid mobile number.");
    }
    if (!data.emergency_informed) {
      return issue(
        "emergency",
        "Confirm whether they’ve been told they’re listed.",
      );
    }
    if (!data.safety_acknowledged) {
      return issue("emergency", "Acknowledge the safety reporting note.");
    }
  }

  if (stepId === "agreements") {
    const missing = CLEANER_AGREEMENT_DOCS.filter(
      (doc) => !data.agreement_keys.includes(doc.key),
    );
    if (missing.length > 0) {
      return issue(
        "agreements",
        "Accept every agreement before submitting.",
      );
    }
    if (!data.accuracy_confirmed) {
      return issue(
        "agreements",
        "Confirm that the information in your application is accurate.",
      );
    }
  }

  if (stepId === "photo" && !data.headshot_url) {
    return issue("headshot", "Upload a clear headshot of yourself.");
  }

  if (stepId === "about") {
    if (data.full_name.length < 2) {
      return issue("full_name", "Enter your full name.");
    }
    if (data.phone.length < 7) {
      return issue("phone", "Enter a valid phone number.");
    }
    if (data.bio.length < 20) {
      return issue(
        "bio",
        "Write a little more about yourself (at least 20 characters).",
      );
    }
  }

  if (stepId === "consent" && !data.location_tracking_consent_accepted) {
    return issue("consent", "Accept location consent before submitting.");
  }

  return null;
}

/** Banner shown briefly when a step is saved and the cleaner moves on. */
function stepSuccessMessage(stepId: StepId, value: OnboardingData) {
  if (stepId === "utr" && value.utr_path === "have") {
    return "UTR submitted successfully!";
  }
  if (stepId === "dbs" && value.dbs_path === "have") {
    return "DBS certificate submitted successfully!";
  }
  if (stepId === "insurance" && value.insurance_path === "have") {
    return "Insurance submitted successfully!";
  }
  if (stepId === "emergency") return "Emergency contact saved!";
  return null;
}

function isStepComplete(stepId: StepId, value: OnboardingData) {
  return validateStep(stepId, value) === null;
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error:
      text ||
      `Request failed with status ${response.status}. Please try again.`,
  };
}

function CoverageMap({
  center,
  radiusMiles,
  showCircle,
}: {
  center: { lat: number; lng: number };
  radiusMiles: number;
  showCircle: boolean;
}) {
  const radiusMeters = Math.max(1, radiusMiles) * MILES_TO_METRES;
  const zoom =
    radiusMiles <= 3
      ? 12
      : radiusMiles <= 8
        ? 11
        : radiusMiles <= 12
          ? 10
          : radiusMiles <= 20
            ? 9
            : 8;

  return (
    <GeoapifyMapView
      // Remount when the centre moves so the style cannot leave us on a default city.
      key={`${center.lat.toFixed(4)}-${center.lng.toFixed(4)}-${showCircle ? "home" : "city"}`}
      center={center}
      circles={
        showCircle
          ? [
              {
                center,
                color: "#312c79",
                id: "coverage",
                radiusMeters,
              },
            ]
          : []
      }
      className="h-44 overflow-hidden rounded-2xl border-2 border-[#1c133b] sm:h-56"
      markers={
        showCircle
          ? [
              {
                color: "#312c79",
                id: "home",
                position: center,
                title: "Home base",
              },
            ]
          : []
      }
      zoom={zoom}
    />
  );
}
