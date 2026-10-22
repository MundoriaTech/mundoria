"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileBadge,
  FileUp,
  Minus,
  Monitor,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  hasBothDocumentSides,
  parseDocumentUrls,
  withDocumentSide,
} from "@/lib/cleaner/document-urls";
import {
  INTERVIEW_DURATION_MINUTES,
  upcomingInterviewDays,
} from "@/lib/cleaner/interview-slots";
import { TrainingSurvey } from "@/components/cleaner/training-survey";
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
  BIRMINGHAM_AREAS,
  BIRMINGHAM_POSTCODES,
} from "@/lib/seo/marketing";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";
import type { ServiceCategory, ServiceType } from "@/types/customer";

const BIRMINGHAM_CENTER = { lat: 52.4862, lng: -1.8904 };
const MAX_RADIUS_MILES = 15;
const DEFAULT_RADIUS_MILES = 8;
const MILES_TO_METRES = 1609.344;

const COVERAGE_SHORTCUTS = BIRMINGHAM_POSTCODES.map((item) => {
  const area = BIRMINGHAM_AREAS.find((entry) => entry.slug === item.areaSlug);
  return {
    label: area ? `${area.name} · ${item.prefix}` : item.prefix,
    prefix: item.prefix,
  };
});

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

type DocSlotKey = "headshot" | "id:0" | "id:1" | "dbs:0" | "dbs:1";

function docSlotKey(
  kind: "dbs" | "id" | "headshot",
  side: 0 | 1 = 0,
): DocSlotKey {
  if (kind === "headshot") return "headshot";
  return `${kind}:${side}`;
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
  "border-2 border-[#1c133b] bg-[#f9f6ef] focus-visible:ring-[#1c133b]";

const STEPS = [
  { id: "about", label: "About you", minutes: 2 },
  { id: "photo", label: "Your profile picture", minutes: 2 },
  { id: "services", label: "Your services", minutes: 2 },
  { id: "hours", label: "Your hours", minutes: 3 },
  { id: "coverage", label: "Your coverage area", minutes: 2 },
  { id: "identity", label: "Your identity document", minutes: 3 },
  { id: "dbs", label: "Your DBS certificate", minutes: 3 },
  { id: "utr", label: "Your UTR", minutes: 2 },
  { id: "quiz", label: "Quiz", minutes: 5 },
  { id: "consent", label: "Location consent", minutes: 1 },
  { id: "appointment", label: "Your appointment with Mundoria", minutes: 3 },
  { id: "payout", label: "Getting paid", minutes: 2 },
] as const;

const GROUPS: { ids: StepId[]; title: string; blurb: string }[] = [
  {
    ids: ["about", "photo", "services", "hours", "coverage"],
    title: "About your work",
    blurb: "Who you are and how you like to work",
  },
  {
    ids: ["identity", "dbs", "utr", "quiz"],
    title: "Checks and documents",
    blurb: "ID, DBS, tax and a short quiz",
  },
  {
    ids: ["consent", "appointment", "payout"],
    title: "Finish",
    blurb: "Consent, interview and payout preference",
  },
];

const STEP_WHY: Record<StepId, string> = {
  about: "Customers see your name and a short bio before they book.",
  photo: "A clear face photo helps customers recognise you on the day.",
  services: "We only offer you jobs that match what you’re happy to do.",
  hours: "We’ll match bookings to the days and times you can work.",
  coverage: "Jobs stay near your home base, inside the radius you choose.",
  identity: "We verify identity before any jobs go live.",
  dbs: "DBS checks help keep homes and families safe.",
  utr: "Confirms you’re set up as self-employed with HMRC.",
  quiz: "A quick check that you know how Mundoria jobs work.",
  consent: "GPS is only used when you check in and check out of an active job.",
  appointment: "A short online chat so we can approve your account.",
  payout: "Pick weekly or monthly payouts. Bank details can wait until later.",
};

const STEP_HEADER_ICONS: Record<StepId, string> = {
  about: "/images/marketing/icons/onboarding-mark.svg",
  photo: "/images/marketing/icons/profile-mark.svg",
  services: "/images/marketing/icons/services-mark.svg",
  hours: "/images/marketing/icons/hours-mark.svg",
  coverage: "/images/marketing/icons/coverage-mark.svg",
  identity: "/images/marketing/icons/identity-mark.svg",
  dbs: "/images/marketing/icons/dbs-mark.svg",
  utr: "/images/marketing/icons/utr-mark.svg",
  quiz: "/images/marketing/icons/quiz-mark.svg",
  consent: "/images/marketing/icons/consent-mark.svg",
  appointment: "/images/marketing/icons/appointment-mark.svg",
  payout: "/images/marketing/icons/payout-mark.svg",
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
};

type OnboardingData = {
  interview_scheduled_at: string | null;
  availability: AvailabilityDay[];
  bio: string;
  dbs_document_url: string;
  full_name: string;
  headshot_url: string;
  id_document_url: string;
  location_tracking_consent_accepted: boolean;
  location_tracking_consent_version: string;
  payout_confirmed: boolean;
  payout_preference: "weekly" | "monthly";
  phone: string;
  services: string[];
  skills_exam_answers: Record<string, SkillsExamAnswer>;
  training_agreements: boolean[];
  utr_number: string;
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
  const [data, setData] = useState<OnboardingData>({
    interview_scheduled_at: cleaner.interview_scheduled_at ?? null,
    availability: days.map((_, day_of_week) => ({
      day_of_week,
      end_time: "23:00",
      is_available: false,
      start_time: "07:00",
    })),
    bio: cleaner.bio ?? "",
    dbs_document_url: cleaner.dbs_document_url ?? "",
    full_name: profile.full_name,
    headshot_url: cleaner.headshot_url ?? "",
    id_document_url: cleaner.id_document_url ?? "",
    location_tracking_consent_accepted: Boolean(
      cleaner.location_tracking_consent_at,
    ),
    location_tracking_consent_version: "cleaner-location-consent-v1",
    payout_confirmed: false,
    payout_preference: cleaner.payout_preference,
    phone: profile.phone ?? "",
    services: [] as string[],
    skills_exam_answers: {},
    training_agreements: CHARTER_AGREEMENTS.map(() => false),
    utr_number: cleaner.utr_number ?? "",
    home_base: "",
    home_base_lat: null,
    home_base_lng: null,
    working_areas: [] as string[],
    working_radius_miles: Math.min(
      MAX_RADIUS_MILES,
      Math.max(
        1,
        Math.round((cleaner.working_radius_km ?? DEFAULT_RADIUS_MILES * 1.609344) / 1.609344),
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

  function update<Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) {
    setNotice(null);
    setFieldIssue(null);
    setPreviewNote(null);
    setData((current) => ({ ...current, [key]: value }));
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1600);
  }

  function toggleStep(stepId: StepId) {
    setNotice(null);
    setFieldIssue(null);
    setExpanded(stepId);
  }

  function documentField(kind: "dbs" | "id" | "headshot") {
    return kind === "headshot" ? "headshot_url" : (`${kind}_document_url` as const);
  }

  function documentBucket(kind: "dbs" | "id" | "headshot") {
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
    kind: "dbs" | "id" | "headshot",
    reference: string,
    side: 0 | 1 = 0,
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
    const idUrls = parseDocumentUrls(data.id_document_url);
    const dbsUrls = parseDocumentUrls(data.dbs_document_url);
    void resolveDocPreview("id", idUrls[0] ?? "", 0);
    void resolveDocPreview("id", idUrls[1] ?? "", 1);
    void resolveDocPreview("dbs", dbsUrls[0] ?? "", 0);
    void resolveDocPreview("dbs", dbsUrls[1] ?? "", 1);
    void resolveDocPreview("headshot", data.headshot_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve when stored refs change
  }, [data.id_document_url, data.dbs_document_url, data.headshot_url, preview, profile.id]);

  async function discardDraftFile(
    kind: "dbs" | "id" | "headshot",
    reference: string,
  ) {
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

  async function uploadDocument(
    kind: "dbs" | "id" | "headshot",
    file: File,
    side: 0 | 1 = 0,
  ) {
    setNotice(null);
    setFieldIssue(null);
    const field = documentField(kind);
    const slot = docSlotKey(kind, side);
    const previous =
      kind === "headshot"
        ? data[field]
        : parseDocumentUrls(data[field])[side] ?? "";
    if (kind === "headshot" && !file.type.startsWith("image/")) {
      setNotice({
        message: "Choose a JPEG, PNG, or WebP.",
        title: "Couldn’t upload that file",
      });
      return;
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
          [field]:
            kind === "headshot"
              ? localPreview
              : withDocumentSide(current[field], side, localPreview),
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
      const sideTag = kind === "headshot" ? kind : `${kind}-${side === 0 ? "front" : "back"}`;
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
        [field]:
          kind === "headshot"
            ? nextValue
            : withDocumentSide(current[field], side, nextValue),
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

  async function removeDocument(
    kind: "dbs" | "id" | "headshot",
    side: 0 | 1 = 0,
  ) {
    const field = documentField(kind);
    const slot = docSlotKey(kind, side);
    const current =
      kind === "headshot"
        ? data[field]
        : parseDocumentUrls(data[field])[side] ?? "";
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
      [field]:
        kind === "headshot"
          ? ""
          : withDocumentSide(current[field], side, ""),
    }));
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1600);
  }

  async function connectStripe() {
    setNotice(null);
    setFieldIssue(null);
    if (preview) {
      setPreviewNote("Stripe Connect is skipped in this preview.");
      return;
    }

    try {
      const response = await fetch("/api/cleaner/stripe-connect", {
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as {
        error?: string;
        url?: string;
      };

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      setNotice({
        message: result.error ?? "Try again in a moment.",
        title: "Couldn’t connect Stripe",
      });
    } catch (stripeError) {
      setNotice({
        message:
          stripeError instanceof Error
            ? stripeError.message
            : "Try again in a moment.",
        title: "Couldn’t connect Stripe",
      });
    }
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
      const payload = Object.fromEntries(
        Object.entries(normalized).filter(([key]) => key !== "payout_confirmed"),
      );
      const response = await fetch("/api/cleaner/onboarding", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as { error?: string };

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
      setSubmitted(true);
      window.setTimeout(() => {
        router.refresh();
      }, 2200);
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

  function continueFromStep() {
    const validationError = validateStep(activeStep.id, data);
    if (validationError) {
      setFieldIssue(validationError);
      setNotice(null);
      return;
    }
    setFieldIssue(null);
    setNotice(null);
    const index = STEPS.findIndex((step) => step.id === activeStep.id);
    const next = STEPS[index + 1];
    if (next) {
      toggleStep(next.id);
      return;
    }
    void submit();
  }

  async function logout() {
    await createBrowserClient().auth.signOut();
    router.replace("/login/cleaner");
    router.refresh();
  }

  const stepIndex = STEPS.findIndex((item) => item.id === activeStep.id) + 1;
  const appointmentActive = activeStep.id === "appointment";
  const isLastStep = stepIndex >= STEPS.length;
  const allComplete = completedCount >= STEPS.length;
  const continueLabel = submitting
    ? "Submitting…"
    : isLastStep
      ? allComplete
        ? "Submit application"
        : "Finish remaining steps"
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
    return (
      <main
        className={cn(
          "flex min-h-screen items-center justify-center px-4 text-[#1c133b]",
          ONBOARDING_PAGE_BG,
        )}
      >
        <div className="w-full max-w-lg rounded-2xl border border-[#e5e1ea] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#e67e22]">Application sent</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#312c79]">
            Thanks — we’re reviewing your application
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5a5470]">
            Keep your interview appointment. We’ll email you when your account
            is approved and jobs can appear in your feed. This usually takes a
            few working days.
          </p>
          {data.interview_scheduled_at ? (
            <p className="mt-5 rounded-xl bg-[#faf6f0] px-4 py-3 text-sm font-medium text-[#1c133b]">
              Interview booked: {formatAppointmentSummary(data.interview_scheduled_at)}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={cn("min-h-screen text-[#1c133b]", ONBOARDING_PAGE_BG)}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px]">
        <aside
          className={cn(
            "hidden w-[260px] shrink-0 flex-col border-r border-[#e8e0d0]/80 px-6 py-7 md:flex lg:w-[280px]",
            ONBOARDING_PAGE_BG,
          )}
        >
          <LandingLogo href="/cleaner/dashboard" />
          <h1 className="mt-8 text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
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
              <div
                className="h-full rounded-full bg-[#1c133b] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <nav aria-label="Onboarding steps" className="mt-7 flex-1 space-y-7">
            {GROUPS.map((group) => {
              const steps = group.ids
                .map((id) => STEPS.find((step) => step.id === id))
                .filter(
                  (step): step is (typeof STEPS)[number] => Boolean(step),
                );
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
                      const isOpen = expanded === step.id;
                      return (
                        <li key={step.id}>
                          <button
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition",
                              isOpen
                                ? "bg-[#f3eee4]"
                                : "hover:bg-[#f3eee4]/70",
                            )}
                            onClick={() => toggleStep(step.id)}
                            type="button"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                isOpen
                                  ? "border-[#1c133b] bg-[#1c133b]"
                                  : complete
                                    ? "border-[#312c79] bg-[#312c79] text-white"
                                    : "border-[#1c133b]/35 bg-[#f9f6ef]",
                              )}
                            >
                              {complete && !isOpen ? (
                                <Check className="h-3 w-3" strokeWidth={3} />
                              ) : null}
                            </span>
                            <span
                              className={cn(
                                "min-w-0 flex-1 text-[15px] leading-snug",
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
          </nav>
          <p
            aria-live="polite"
            className={cn(
              "mt-4 text-xs font-medium transition",
              saveFlash ? "text-[#312c79]" : "text-transparent",
            )}
          >
            Progress saved
          </p>
          {!preview ? (
            <div className="mt-2 space-y-3">
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
            </div>
          ) : (
            <p className="mt-6 text-xs text-[#a39fb0]">Preview mode</p>
          )}
        </aside>

        <div className="min-w-0 flex-1 px-4 py-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-10 md:pb-10 lg:px-12">
          <div className="mb-5 flex items-center justify-between md:hidden">
            <LandingLogo href="/cleaner/dashboard" />
            {!preview ? (
              <div className="flex items-center gap-4">
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

          <div className="mb-5 md:hidden">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b8798]">
              <span>
                {completedCount} of {STEPS.length} done
              </span>
              <span>~{Math.max(minutesLeft, 1)} min left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e0d0]">
              <div
                className="h-full rounded-full bg-[#1c133b] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <nav
              aria-label="Onboarding steps"
              className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {STEPS.map((step) => {
                const complete = isStepComplete(step.id, data);
                const isOpen = expanded === step.id;
                return (
                  <button
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition",
                      isOpen
                        ? "border-[#1c133b] bg-[#1c133b] text-white"
                        : complete
                          ? "border-[#312c79] bg-[#efe8fa] text-[#312c79]"
                          : "border-[#1c133b]/25 bg-[#f9f6ef] text-[#8b8798]",
                    )}
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    type="button"
                  >
                    {complete && !isOpen ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : null}
                    {step.label}
                  </button>
                );
              })}
            </nav>
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
              onConnectStripe={() => void connectStripe()}
              issue={fieldIssue}
              onFile={(kind, file, side) =>
                void uploadDocument(kind, file, side)
              }
              onRemove={(kind, side) => void removeDocument(kind, side)}
              onUpdate={update}
              onSchedule={(startsAt) =>
                update("interview_scheduled_at", startsAt)
              }
              stepId={activeStep.id}
              takenSlots={takenSlots}
              uploadProgress={uploadProgress}
              uploadingSlot={uploadingSlot}
            />
          </div>

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

          <div className="mt-8 hidden items-center justify-between gap-3 md:flex">
            <button
              className="text-sm font-medium text-[#8b8798] hover:text-[#1c133b] disabled:opacity-40"
              disabled={stepIndex <= 1}
              onClick={goBack}
              type="button"
            >
              Back
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
        {isLastStep && !allComplete ? (
          <p className="mx-auto mt-2 max-w-[1200px] text-center text-[11px] leading-4 text-[#8b8798]">
            Complete every step before you submit.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function StepBody({
  askForPhone,
  data,
  docPreviews,
  issue,
  onConnectStripe,
  onFile,
  onRemove,
  onSchedule,
  onUpdate,
  stepId,
  takenSlots,
  uploadProgress,
  uploadingSlot,
}: {
  askForPhone: boolean;
  data: OnboardingData;
  docPreviews: Partial<Record<DocSlotKey, { isPdf: boolean; url: string }>>;
  issue: FieldIssue | null;
  onConnectStripe: () => void;
  onFile: (
    kind: "dbs" | "id" | "headshot",
    file: File,
    side?: 0 | 1,
  ) => void;
  onRemove: (kind: "dbs" | "id" | "headshot", side?: 0 | 1) => void;
  onSchedule: (startsAt: string) => void;
  onUpdate: <Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) => void;
  stepId: StepId;
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
      <HoursPicker
        error={issueFor("hours")}
        onChange={(next) => onUpdate("availability", next)}
        value={data.availability}
      />
    );
  }

  if (stepId === "coverage") {
    return (
      <CoverageStep
        areas={data.working_areas}
        error={
          issueFor("home_base") ??
          issueFor("radius") ??
          issueFor("areas")
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
      <UtrStep
        error={issueFor("utr")}
        onChange={(next) => onUpdate("utr_number", next)}
        value={data.utr_number}
      />
    );
  }

  if (stepId === "identity") {
    return (
      <IdentityStep
        backPreview={docPreviews["id:1"]}
        frontPreview={docPreviews["id:0"]}
        idUrls={parseDocumentUrls(data.id_document_url)}
        issue={issueFor("id")}
        onFile={(file, slot) => onFile("id", file, slot)}
        onRemove={(slot) => onRemove("id", slot)}
        uploadProgress={uploadProgress}
        uploadingSlot={uploadingSlot}
      />
    );
  }

  if (stepId === "dbs") {
    return (
      <DbsStep
        issue={issueFor("dbs")}
        onFile={(file, slot) => onFile("dbs", file, slot)}
        onRemove={(slot) => onRemove("dbs", slot)}
        page1Preview={docPreviews["dbs:0"]}
        page2Preview={docPreviews["dbs:1"]}
        urls={parseDocumentUrls(data.dbs_document_url)}
        uploadProgress={uploadProgress}
        uploadingSlot={uploadingSlot}
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
              "rounded-xl px-3.5 py-3 text-sm text-[#291845]",
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
                className={ONBOARDING_FIELD_CLASS}
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
                <p className="text-sm font-medium text-[#1c133b]">Phone number</p>
                <p
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-xl px-3.5 text-sm text-[#291845]",
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
        <Field error={issueFor("bio")} label="Bio">
          <textarea
            className={cn(
              "min-h-28 w-full rounded-md p-3 text-sm text-[#1c133b] outline-none ring-offset-white focus-visible:ring-2",
              ONBOARDING_FIELD_CLASS,
              issueFor("bio") ? invalidControlClass : undefined,
            )}
            onChange={(event) => onUpdate("bio", event.target.value)}
            value={data.bio}
          />
        </Field>
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

  return (
    <PayoutStep
      confirmed={data.payout_confirmed}
      error={issueFor("payout")}
      onConnectStripe={onConnectStripe}
      onPreference={(preference) => {
        onUpdate("payout_preference", preference);
        onUpdate("payout_confirmed", true);
      }}
      preference={data.payout_preference}
    />
  );
}

const PAYOUT_GUIDE_TIPS = [
  {
    body: "Mundoria pays you for completed jobs through Stripe. Customers never send money directly to you.",
    title: "How you’re paid",
  },
  {
    body: "Choose weekly for faster, regular payouts, or monthly for one consolidated transfer.",
    title: "Weekly or monthly",
  },
] as const;

function PayoutStep({
  confirmed,
  error,
  onConnectStripe,
  onPreference,
  preference,
}: {
  confirmed: boolean;
  error?: string;
  onConnectStripe: () => void;
  onPreference: (preference: "weekly" | "monthly") => void;
  preference: "weekly" | "monthly";
}) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
          onClick={() => setGuideOpen(true)}
          type="button"
        >
          Payout tips
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1c133b]">
          How often should we pay you?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["weekly", "monthly"] as const).map((value) => {
            const selected = confirmed && preference === value;
            return (
              <button
                className={cn(
                  "rounded-xl border-2 bg-[#f9f6ef] p-5 text-left text-[#1c133b] outline-none transition ring-offset-white",
                  selected
                    ? "border-[#1c133b] ring-2 ring-[#1c133b]"
                    : "border-[#1c133b]/35 hover:border-[#1c133b]",
                )}
                key={value}
                onClick={() => onPreference(value)}
                type="button"
              >
                <p className="text-base font-semibold capitalize">{value}</p>
                <p className="mt-1.5 text-sm leading-5 text-[#8b8798]">
                  {value === "weekly"
                    ? "Faster, regular payouts."
                    : "One consolidated monthly payout."}
                </p>
              </button>
            );
          })}
        </div>
        {error ? <FieldError message={error} /> : null}
      </div>

      <div className="space-y-2 border-t border-[#e8e0d0] pt-5">
        <p className="text-sm font-medium text-[#291845]">
          Bank details{" "}
          <span className="font-normal text-[#8b8798]">(optional)</span>
        </p>
        <Button
          className="h-11 rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] px-5 font-semibold text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          onClick={onConnectStripe}
          type="button"
          variant="outline"
        >
          Connect Stripe Express
        </Button>
        <p className="text-xs leading-5 text-[#8b8798]">
          Optional for now. You can connect later from your profile before your
          first payout.
        </p>
      </div>

      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-lg border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)]"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="How payouts work on Mundoria."
          onClose={() => setGuideOpen(false)}
          title="Getting paid tips"
        >
          <ul className="mt-1 space-y-3">
            {PAYOUT_GUIDE_TIPS.map((tip) => (
              <li
                className="rounded-2xl border border-[#e8e0d0] bg-[#f3eee4] px-4 py-3"
                key={tip.title}
              >
                <h3 className="text-sm font-semibold text-[#291845]">
                  {tip.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#5a5470]">
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
        <input
          checked={accepted}
          className="sr-only"
          onChange={(event) => onAccepted(event.target.checked)}
          type="checkbox"
        />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
            accepted
              ? "border-[#312c79] bg-[#312c79] text-white"
              : "border-[#1c133b] bg-transparent",
          )}
        >
          {accepted ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <span className="text-sm font-medium leading-6">
          I agree to GPS capture at check-in and check-out only. We do not track
          you otherwise.
        </span>
      </label>

      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

const UTR_GUIDE_TIPS = [
  {
    body: "Your Unique Taxpayer Reference is a 10-digit number from HMRC. Enter it exactly as shown, with no spaces.",
    title: "10-digit number",
  },
  {
    body: "You’ll find it on HMRC letters or in your personal tax account online. It’s usually labelled Unique Taxpayer Reference or UTR.",
    title: "Where to find it",
  },
  {
    body: "We use it to confirm you’re set up as self-employed. We never share it with customers.",
    title: "Kept private",
  },
] as const;

function UtrStep({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (next: string) => void;
  value: string;
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
          UTR tips
        </button>
      </div>
      <Field error={error} label="UTR number (10 digits)">
        <Input
          className={cn(
            ONBOARDING_FIELD_CLASS,
            error ? invalidControlClass : undefined,
          )}
          inputMode="numeric"
          maxLength={10}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, 10))
          }
          placeholder="1234567890"
          value={value}
        />
      </Field>
      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-lg border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)]"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="A quick guide to your Unique Taxpayer Reference."
          onClose={() => setGuideOpen(false)}
          title="UTR tips"
        >
          <ul className="mt-1 space-y-3">
            {UTR_GUIDE_TIPS.map((tip) => (
              <li
                className="rounded-2xl border border-[#e8e0d0] bg-[#f3eee4] px-4 py-3"
                key={tip.title}
              >
                <h3 className="text-sm font-semibold text-[#291845]">
                  {tip.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#5a5470]">
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

const DBS_GUIDE_TIPS = [
  {
    body: "Paper certificates usually need every page — upload page 1 and page 2 so nothing is missing.",
    image: "/images/marketing/onboarding/dbs-tip-pages.svg",
    title: "Both pages",
  },
  {
    body: "A multi-page PDF is fine in either slot if both pages are included and the text is clear.",
    image: "/images/marketing/onboarding/dbs-tip-pdf.svg",
    title: "PDF is fine",
  },
] as const;

function DbsStep({
  issue,
  onFile,
  onRemove,
  page1Preview,
  page2Preview,
  urls,
  uploadProgress,
  uploadingSlot,
}: {
  issue?: string;
  onFile: (file: File, slot: 0 | 1) => void;
  onRemove: (slot: 0 | 1) => void;
  page1Preview?: { isPdf?: boolean; url?: string };
  page2Preview?: { isPdf?: boolean; url?: string };
  urls: string[];
  uploadProgress: number;
  uploadingSlot: string | null;
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
          DBS tips
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DocumentUpload
          error={issue}
          label="Page 1"
          onFile={(file) => onFile(file, 0)}
          onRemove={() => onRemove(0)}
          previewIsPdf={page1Preview?.isPdf}
          previewUrl={page1Preview?.url}
          progress={uploadingSlot === "dbs:0" ? uploadProgress : undefined}
          uploaded={Boolean(page1Preview?.url || urls[0])}
          uploading={uploadingSlot === "dbs:0"}
        />
        <DocumentUpload
          label="Page 2"
          onFile={(file) => onFile(file, 1)}
          onRemove={() => onRemove(1)}
          previewIsPdf={page2Preview?.isPdf}
          previewUrl={page2Preview?.url}
          progress={uploadingSlot === "dbs:1" ? uploadProgress : undefined}
          uploaded={Boolean(page2Preview?.url || urls[1])}
          uploading={uploadingSlot === "dbs:1"}
        />
      </div>
      {guideOpen ? (
        <AppModal
          backdrop="blur"
          className="max-w-2xl border-[#e8e0d0] bg-[#f9f6ef] text-[#1c133b] shadow-[0_24px_60px_rgba(28,19,59,0.18)] sm:max-w-3xl"
          closeClassName="h-9 w-9 rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          description="What we need so we can review your DBS certificate quickly."
          onClose={() => setGuideOpen(false)}
          title="DBS certificate tips"
        >
          <div className={guideTipGridClass(DBS_GUIDE_TIPS.length)}>
            {DBS_GUIDE_TIPS.map((tip) => (
              <article
                className="overflow-hidden rounded-2xl border border-[#e8e0d0] bg-[#f3eee4]"
                key={tip.title}
              >
                <div className="flex h-24 items-center justify-center bg-[#f9f6ef] px-4 py-3 sm:h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local tip illustrations */}
                  <img
                    alt=""
                    className="h-full w-auto max-h-16 object-contain sm:max-h-20"
                    src={tip.image}
                  />
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
  backPreview,
  frontPreview,
  idUrls,
  issue,
  onFile,
  onRemove,
  uploadProgress,
  uploadingSlot,
}: {
  backPreview?: { isPdf?: boolean; url?: string };
  frontPreview?: { isPdf?: boolean; url?: string };
  idUrls: string[];
  issue?: string;
  onFile: (file: File, slot: 0 | 1) => void;
  onRemove: (slot: 0 | 1) => void;
  uploadProgress: number;
  uploadingSlot: string | null;
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
          ID tips
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DocumentUpload
          error={issue}
          label="Front"
          onFile={(file) => onFile(file, 0)}
          onRemove={() => onRemove(0)}
          previewIsPdf={frontPreview?.isPdf}
          previewUrl={frontPreview?.url}
          progress={uploadingSlot === "id:0" ? uploadProgress : undefined}
          uploaded={Boolean(frontPreview?.url || idUrls[0])}
          uploading={uploadingSlot === "id:0"}
        />
        <DocumentUpload
          label="Back"
          onFile={(file) => onFile(file, 1)}
          onRemove={() => onRemove(1)}
          previewIsPdf={backPreview?.isPdf}
          previewUrl={backPreview?.url}
          progress={uploadingSlot === "id:1" ? uploadProgress : undefined}
          uploaded={Boolean(backPreview?.url || idUrls[1])}
          uploading={uploadingSlot === "id:1"}
        />
      </div>
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
    body: "Choose the Birmingham district you usually start from. We use this as the centre of your coverage map.",
    title: "Home base",
  },
  {
    body: `Set how far you’re willing to travel, up to ${MAX_RADIUS_MILES} miles. Jobs outside that circle won’t be offered.`,
    title: "Working radius",
  },
  {
    body: "Optionally tap extra Birmingham districts you cover. Your home base is already included.",
    title: "Extra districts",
  },
] as const;

function OnboardingSelect({
  error,
  onChange,
  options,
  placeholder,
  value,
}: {
  error?: boolean;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  placeholder: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
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
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#1c133b]",
          ONBOARDING_FIELD_CLASS,
          error ? invalidControlClass : undefined,
          open && "ring-2 ring-[#1c133b]",
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={cn(selected ? "font-medium text-[#1c133b]" : "text-[#8b8798]")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#1c133b] transition",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
        />
      </button>
      {open ? (
        <ul
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-1.5 shadow-[0_18px_40px_rgba(28,19,59,0.14)]"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    isSelected
                      ? "bg-[#312c79] text-white"
                      : "text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
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
  const mapCenter =
    homeBaseLat != null && homeBaseLng != null
      ? { lat: homeBaseLat, lng: homeBaseLng }
      : BIRMINGHAM_CENTER;
  const mapReady = homeBaseLat != null && homeBaseLng != null;
  const homeBaseValue =
    COVERAGE_SHORTCUTS.find((item) => item.prefix === homePrefix)?.prefix ?? "";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geocode when home base text changes
  }, [homeBase]);

  function toggleShortcut(prefix: string) {
    if (prefix === homePrefix) return;
    if (areas.includes(prefix)) {
      onAreas(areas.filter((item) => item !== prefix));
      return;
    }
    onAreas([...areas, prefix]);
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

      <div className="flex flex-col gap-6 sm:gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-full shrink-0 space-y-2 sm:w-[17.5rem]">
            <p className="text-sm font-medium text-[#291845]">Home base</p>
            <OnboardingSelect
              error={
                error?.toLowerCase().includes("home") ||
                error?.toLowerCase().includes("postcode")
              }
              onChange={onHomeBase}
              options={COVERAGE_SHORTCUTS.map((item) => ({
                label: item.label,
                value: item.prefix,
              }))}
              placeholder="Choose your home district…"
              value={homeBaseValue}
            />
            {geocoding ? (
              <p className="text-xs text-[#8b8798]">
                Finding that area on the map…
              </p>
            ) : null}
          </div>
          <div className="flex flex-1 justify-center sm:px-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#291845]">
                Working radius
              </p>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease radius"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={miles <= 1}
                  onClick={() => onRadiusMiles(miles - 1)}
                  type="button"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <div className="min-w-[5.5rem] text-center">
                  <p className="text-lg font-semibold tabular-nums text-[#291845]">
                    {miles}
                  </p>
                  <p className="text-xs font-medium text-[#8b8798]">
                    {miles === 1 ? "mile" : "miles"}
                  </p>
                </div>
                <button
                  aria-label="Increase radius"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={miles >= MAX_RADIUS_MILES}
                  onClick={() => onRadiusMiles(miles + 1)}
                  type="button"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#291845]">
            Extra districts{" "}
            <span className="font-normal text-[#8b8798]">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {COVERAGE_SHORTCUTS.map((shortcut) => {
              const selected = areas.includes(shortcut.prefix);
              const isHome = shortcut.prefix === homePrefix;
              return (
                <button
                  className={cn(
                    "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition",
                    isHome
                      ? "cursor-default border-[#8b8798] bg-[#f3eee4] text-[#8b8798]"
                      : selected
                        ? "border-[#312c79] bg-[#312c79] text-white"
                        : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                  )}
                  disabled={isHome}
                  key={shortcut.prefix}
                  onClick={() => toggleShortcut(shortcut.prefix)}
                  type="button"
                >
                  {shortcut.label}
                </button>
              );
            })}
          </div>
        </div>

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

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <FieldError message={error} /> : null}
    </label>
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

function hoursAreUniform(daysList: AvailabilityDay[]) {
  const active = daysList.filter((day) => day.is_available);
  if (active.length <= 1) return true;
  const start = active[0].start_time;
  const end = active[0].end_time;
  return active.every(
    (day) => day.start_time === start && day.end_time === end,
  );
}

function HoursPicker({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (next: AvailabilityDay[]) => void;
  value: AvailabilityDay[];
}) {
  const [customiseByDay, setCustomiseByDay] = useState(
    () => !hoursAreUniform(value),
  );
  const active = value.filter((day) => day.is_available);
  const [sharedStart, setSharedStart] = useState(() =>
    clampWorkingTime(active[0]?.start_time || DEFAULT_START),
  );
  const [sharedEnd, setSharedEnd] = useState(() =>
    clampWorkingTime(active[0]?.end_time || DEFAULT_END),
  );

  function patchDays(
    updater: (day: AvailabilityDay, index: number) => AvailabilityDay,
  ) {
    onChange(value.map((day, index) => updater(day, index)));
  }

  function toggleDay(dayOfWeek: number) {
    patchDays((day) => {
      if (day.day_of_week !== dayOfWeek) return day;
      const nextAvailable = !day.is_available;
      if (!nextAvailable) return { ...day, is_available: false };
      if (customiseByDay) return { ...day, is_available: true };
      return {
        ...day,
        end_time: sharedEnd,
        is_available: true,
        start_time: sharedStart,
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
    patchDays((day) => {
      const on = selected ? selected.has(day.day_of_week) : true;
      if (!on) return { ...day, is_available: false };
      if (customiseByDay) return { ...day, is_available: true };
      return {
        ...day,
        end_time: sharedEnd,
        is_available: true,
        start_time: sharedStart,
      };
    });
  }

  function setSharedHours(start: string, end: string) {
    const nextStart = clampWorkingTime(start);
    const nextEnd = clampWorkingTime(end);
    setSharedStart(nextStart);
    setSharedEnd(nextEnd);
    patchDays((day) =>
      day.is_available
        ? { ...day, end_time: nextEnd, start_time: nextStart }
        : day,
    );
  }

  function setDayHours(dayOfWeek: number, start: string, end: string) {
    const nextStart = clampWorkingTime(start);
    const nextEnd = clampWorkingTime(end);
    patchDays((day) =>
      day.day_of_week === dayOfWeek
        ? { ...day, end_time: nextEnd, start_time: nextStart }
        : day,
    );
  }

  function enableCustomise(next: boolean) {
    setCustomiseByDay(next);
    if (!next) {
      setSharedHours(sharedStart, sharedEnd);
    }
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

      <div className="flex flex-wrap gap-2">
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

      <div>
        <p className="mb-3 text-sm font-medium text-[#291845]">Days you work</p>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {HOURS_DAY_ORDER.map((dayOfWeek) => {
            const day = value.find((item) => item.day_of_week === dayOfWeek);
            const selected = Boolean(day?.is_available);
            const label = HOURS_DAY_SHORT[dayOfWeek];
            return (
              <button
                aria-label={label}
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

      {!customiseByDay ? (
        <div>
          <p className="mb-3 text-sm font-medium text-[#291845]">
            Available hours
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Input
              aria-label="Start time"
              className={ONBOARDING_FIELD_CLASS}
              max={WORKING_HOURS_MAX}
              min={WORKING_HOURS_MIN}
              onChange={(event) =>
                setSharedHours(event.target.value, sharedEnd)
              }
              type="time"
              value={sharedStart}
            />
            <span className="text-sm text-[#8b8798]">to</span>
            <Input
              aria-label="End time"
              className={ONBOARDING_FIELD_CLASS}
              max={WORKING_HOURS_MAX}
              min={WORKING_HOURS_MIN}
              onChange={(event) =>
                setSharedHours(sharedStart, event.target.value)
              }
              type="time"
              value={sharedEnd}
            />
          </div>
          <p className="mt-2 text-xs text-[#8b8798]">
            Applies to every day you select. Jobs run between{" "}
            {WORKING_HOURS_MIN} and {WORKING_HOURS_MAX}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#291845]">Hours by day</p>
          {active.length === 0 ? (
            <p className="text-sm text-[#8b8798]">Select at least one day first.</p>
          ) : (
            HOURS_DAY_ORDER.map((dayOfWeek) => {
              const day = value.find((item) => item.day_of_week === dayOfWeek);
              if (!day?.is_available) return null;
              return (
                <div
                  className="grid grid-cols-[2.75rem_1fr_auto_1fr] items-center gap-2 sm:grid-cols-[4.5rem_1fr_auto_1fr]"
                  key={dayOfWeek}
                >
                  <span className="text-sm font-medium text-[#291845]">
                    {HOURS_DAY_SHORT[dayOfWeek]}
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
              );
            })
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-3 text-sm text-[#1c133b]">
        <input
          checked={customiseByDay}
          className="sr-only"
          onChange={(event) => enableCustomise(event.target.checked)}
          type="checkbox"
        />
        <span
          aria-hidden
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
            customiseByDay
              ? "border-[#312c79] bg-[#312c79] text-white"
              : "border-[#d8d0e5] bg-white",
          )}
        >
          {customiseByDay ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <span>Different hours on some days</span>
      </label>
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
                    <input
                      checked={isSelected}
                      className="sr-only"
                      onChange={(event) =>
                        toggleService(service.value, event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                        !isSelected && "border-[#d8d0e5] bg-white",
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: theme.accent,
                              borderColor: theme.accent,
                              color: "#ffffff",
                            }
                          : undefined
                      }
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : null}
                    </span>
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

function DocumentUpload({
  accept = ".pdf,image/*",
  error,
  label,
  onFile,
  onRemove,
  previewIsPdf = false,
  previewUrl,
  progress,
  uploaded,
  uploading = false,
}: {
  accept?: string;
  error?: string;
  label: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
  previewIsPdf?: boolean;
  previewUrl?: string;
  progress?: number;
  uploaded: boolean;
  uploading?: boolean;
}) {
  const imageOnly = accept.includes("image") && !accept.includes("pdf");
  const looksLikePdf = Boolean(previewUrl) && previewIsPdf;
  const showImagePreview = Boolean(previewUrl) && !looksLikePdf;
  const percent =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#291845]">{label}</p>
      {showImagePreview || looksLikePdf || uploading ? (
        <div className="relative pt-3">
          {!uploading && (uploaded || previewUrl) && onRemove ? (
            <button
              aria-label={`Remove ${label}`}
              className="absolute right-2 top-0 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#d4694a] bg-[#fff4ee] text-[#d4694a] shadow-sm transition hover:bg-[#d4694a] hover:text-white"
              onClick={onRemove}
              type="button"
            >
              <X className="h-4 w-4" strokeWidth={2.75} />
            </button>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-[#e5e1ea] bg-[#faf8ff]">
            <div className="relative flex min-h-[12rem] items-center justify-center bg-[#f3f0f8]">
              {showImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed/blob preview URLs
                <img
                  alt={`${label} preview`}
                  className="max-h-72 w-full object-contain"
                  src={previewUrl}
                />
              ) : looksLikePdf ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efe8fa] text-[#6a45b8]">
                    <FileBadge className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#291845]">
                      PDF ready
                    </p>
                    <a
                      className="mt-1 inline-block text-sm font-medium text-[#6a45b8] hover:underline"
                      href={previewUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open preview
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-[#6a45b8]">
                  <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#d8ccee] border-t-[#6a45b8]" />
                  <p className="text-sm font-medium">Preparing preview…</p>
                </div>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#291845]/55 backdrop-blur-[2px]">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-white/25" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {percent ?? 0}%
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Uploading… {percent ?? 0}%
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe6f2] bg-white px-4 py-3">
              <p className="text-sm font-medium text-[#291845]">
                {uploading
                  ? `Uploading… ${percent ?? 0}%`
                  : uploaded
                    ? "Uploaded"
                    : "Choose a file"}
              </p>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#e5e1ea] bg-white px-3 py-2 text-sm font-semibold text-[#291845] hover:bg-[#faf8ff]">
                {uploaded || previewUrl ? "Replace" : "Choose file"}
                <input
                  accept={accept}
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onFile(file);
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-[#f9f6ef] p-8 text-center transition",
            error
              ? "border-[#d4694a] hover:border-[#d4694a]"
              : "border-[#1c133b]/55 hover:border-[#1c133b]",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <FileUp className="h-8 w-8 text-[#1c133b]" strokeWidth={2.25} />
          <b className="mt-3 text-sm text-[#291845]">Choose file</b>
          <span className="mt-1 text-xs text-[#8b8798]">
            {imageOnly ? "JPEG, PNG or WebP" : "PDF, JPEG, PNG or WebP"}
          </span>
          <input
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      )}
      {error ? (
        <div>
          <FieldError message={error} />
        </div>
      ) : null}
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

function sanitizeOnboardingData(value: OnboardingData): OnboardingData {
  return {
    ...value,
    interview_scheduled_at: toIso(value.interview_scheduled_at),
    availability: (value.availability ?? []).map((day) => ({
      day_of_week: Number(day.day_of_week),
      end_time: String(day.end_time ?? "").trim(),
      is_available: Boolean(day.is_available),
      start_time: String(day.start_time ?? "").trim(),
    })),
    bio: String(value.bio ?? "").trim(),
    dbs_document_url: String(value.dbs_document_url ?? "").trim(),
    full_name: String(value.full_name ?? "").trim(),
    headshot_url: String(value.headshot_url ?? "").trim(),
    id_document_url: String(value.id_document_url ?? "").trim(),
    location_tracking_consent_accepted: Boolean(
      value.location_tracking_consent_accepted,
    ),
    location_tracking_consent_version: String(
      value.location_tracking_consent_version ??
        "cleaner-location-consent-v1",
    ).trim(),
    payout_confirmed: Boolean(value.payout_confirmed),
    payout_preference:
      value.payout_preference === "monthly" ? "monthly" : "weekly",
    phone: String(value.phone ?? "").trim(),
    services: (value.services ?? [])
      .map((service) => service.trim())
      .filter(Boolean),
    skills_exam_answers: sanitizeExamAnswers(value.skills_exam_answers),
    training_agreements: CHARTER_AGREEMENTS.map(
      (_, index) => Boolean(value.training_agreements?.[index]),
    ),
    utr_number: String(value.utr_number ?? "")
      .replace(/\D/g, "")
      .slice(0, 10),
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
      .filter(Boolean),
    working_radius_miles: (() => {
      const miles = Number(value.working_radius_miles);
      if (!Number.isFinite(miles)) return DEFAULT_RADIUS_MILES;
      return Math.min(MAX_RADIUS_MILES, Math.max(1, Math.round(miles)));
    })(),
    years_experience: Number.isFinite(value.years_experience)
      ? value.years_experience
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
  }

  if (stepId === "coverage") {
    if (ukOutwardCode(data.home_base).length < 2) {
      return issue(
        "home_base",
        "Enter your home postcode or area, for example B15.",
      );
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

  if (stepId === "utr" && !/^\d{10}$/.test(data.utr_number)) {
    return issue("utr", "Enter your 10-digit UTR number.");
  }

  if (stepId === "identity" && !hasBothDocumentSides(data.id_document_url)) {
    return issue("id", "Upload the front and back of your ID.");
  }

  if (stepId === "dbs" && !hasBothDocumentSides(data.dbs_document_url)) {
    return issue("dbs", "Upload page 1 and page 2 of your DBS certificate.");
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
      return issue("bio", "Bio must be at least 20 characters.");
    }
  }

  if (stepId === "consent" && !data.location_tracking_consent_accepted) {
    return issue("consent", "Accept location consent before submitting.");
  }

  if (stepId === "payout" && !data.payout_confirmed) {
    return issue("payout", "Choose weekly or monthly payouts.");
  }

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
    radiusMiles <= 3 ? 12 : radiusMiles <= 8 ? 11 : radiusMiles <= 12 ? 10 : 9;

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
