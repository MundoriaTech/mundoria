import { getRequestUser } from "@/lib/supabase/request-client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { listTakenInterviewSlots } from "@/lib/cleaner/interview-availability";
import {
  formatInterviewSlot,
  isBookableInterviewSlot,
  upcomingInterviewDays,
} from "@/lib/cleaner/interview-slots";
import {
  CLEANER_AGREEMENT_DOCS,
  generateApplicationReference,
  isAcceptableInsuranceCover,
  isPastDateIso,
  isValidUtr,
  namesLikelyMatch,
  normalizeInsuranceCoverAmount,
  parseTransportModes,
} from "@/lib/cleaner/onboarding-compliance";
import {
  CHARTER_AGREEMENTS,
  scoreSkillsExam,
  SKILLS_EXAM_PASS_SCORE,
  SKILLS_EXAM_QUESTIONS,
} from "@/lib/cleaner/skills-exam";
import { hasAnyDocument } from "@/lib/cleaner/document-urls";
import { trackUserActivity } from "@/lib/analytics/user-activity";
import {
  resolveAdminNotificationEmail,
  sendBrandedEmail,
} from "@/lib/email/send-email";
import {
  createInAppNotification,
  sendOneSignalNotification,
} from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { upsertZohoLead } from "@/lib/zoho/crm";

const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const requiredStringList = (label: string) =>
  z
    .array(z.string().trim())
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(z.string()).min(1, label));

const optionalStringList = z
  .array(z.string().trim())
  .transform((items) => items.filter(Boolean))
  .default([]);

/** UK outward code from a full or partial postcode (e.g. B15 2TT → B15). */
function ukOutwardCode(value: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!cleaned) return "";
  const spaced = cleaned.split(" ");
  if (spaced.length >= 2) return spaced[0] ?? "";
  const match = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match?.[1] ?? cleaned;
}

const MAX_RADIUS_MILES = 15;
const MAX_WORKING_DISTRICTS = 6;

const schema = z
  .object({
    accuracy_confirmed: z.literal(true, {
      errorMap: () => ({
        message: "Confirm your application information is accurate",
      }),
    }),
    agreement_keys: z.array(z.string().trim()).default([]),
    availability: z.array(
      z.object({
        day_of_week: z.number().int().min(0).max(6),
        end_time: requiredString("Availability end time"),
        is_available: z.boolean(),
        start_time: requiredString("Availability start time"),
        end_time_2: z.string().trim().optional().default(""),
        start_time_2: z.string().trim().optional().default(""),
      }),
    ),
    bio: z
      .string()
      .trim()
      .min(20, "Bio must be at least 20 characters")
      .max(2000, "Bio is too long"),
    booking_preferences: optionalStringList,
    can_transport_equipment: z.string().trim().optional().default(""),
    cleaning_skills: optionalStringList,
    cleaning_skills_other: z.string().trim().optional().default(""),
    dbs_certificate_number: z.string().trim().optional().default(""),
    dbs_document_url: z.string().trim().optional().default(""),
    dbs_issued_on: z.string().trim().optional().default(""),
    dbs_path: z.enum(["have", "apply", "waiting"]),
    emergency_alt_phone: z.string().trim().optional().default(""),
    emergency_country: z.string().trim().optional().default("United Kingdom"),
    emergency_email: z.string().trim().optional().default(""),
    emergency_informed: z.string().trim().min(1, "Confirm emergency contact notice"),
    emergency_mobile: z.string().trim().min(7, "Enter a valid emergency mobile"),
    emergency_name: z.string().trim().min(2, "Enter emergency contact name"),
    emergency_relationship: z
      .string()
      .trim()
      .min(1, "Choose emergency contact relationship"),
    emergency_relationship_other: z.string().trim().optional().default(""),
    equipment_condition: z.string().trim().optional().default(""),
    equipment_other: z.string().trim().optional().default(""),
    equipment_owned: optionalStringList,
    equipment_ownership: requiredString("Equipment ownership"),
    equipment_transport: z.string().trim().optional().default(""),
    experience_band: z.string().trim().optional().default(""),
    full_name: z.string().trim().min(2, "Full name is required"),
    headshot_url: requiredString("Profile headshot"),
    home_base: z
      .string()
      .trim()
      .min(2, "Enter your home postcode or area"),
    home_base_lat: z.number().finite().nullable(),
    home_base_lng: z.number().finite().nullable(),
    id_document_url: requiredString("Government-issued ID"),
    insurance_certificate_url: z.string().trim().optional().default(""),
    insurance_activity_confirmed: z.boolean().optional().default(false),
    insurance_cover_amount: z.string().trim().optional().default(""),
    insurance_insured_name: z.string().trim().optional().default(""),
    insurance_expiry_date: z.string().trim().optional().default(""),
    insurance_path: z.enum(["have", "none", "unsure"]),
    insurance_policy_number: z.string().trim().optional().default(""),
    insurance_provider: z.string().trim().optional().default(""),
    interview_scheduled_at: z
      .string()
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Choose a valid interview time.",
      ),
    location_tracking_consent_accepted: z.literal(true, {
      errorMap: () => ({ message: "Location consent is required" }),
    }),
    location_tracking_consent_version: z
      .string()
      .trim()
      .default("cleaner-location-consent-v1"),
    marketing_consent: z.boolean().optional().default(false),
    payout_preference: z.enum(["weekly", "monthly"]).optional().default("weekly"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    ppe_other: z.string().trim().optional().default(""),
    ppe_owned: optionalStringList,
    preferred_hours_band: z.string().trim().optional().default(""),
    prior_work_duration: z.string().trim().optional().default(""),
    prior_work_employer: z.string().trim().optional().default(""),
    prior_work_summary: z.string().trim().optional().default(""),
    prior_work_type: z.string().trim().optional().default(""),
    products_other: z.string().trim().optional().default(""),
    products_owned: optionalStringList,
    products_ownership: requiredString("Products ownership"),
    safety_acknowledged: z.literal(true, {
      errorMap: () => ({ message: "Acknowledge the safety note" }),
    }),
    services: requiredStringList("Select at least one service"),
    skills_exam_answers: z.record(
      z.string(),
      z.union([
        z.number().int().min(0).max(3),
        z.array(z.number().int().min(0).max(3)).min(1).max(4),
      ]),
    ),
    reference_company: z.string().trim().optional().default(""),
    reference_contact_ok: z.boolean().optional().default(false),
    reference_email: z.string().trim().optional().default(""),
    reference_name: z.string().trim().optional().default(""),
    reference_phone: z.string().trim().optional().default(""),
    reference_relationship: z.string().trim().optional().default(""),
    specialised_equipment: optionalStringList,
    specialised_other: z.string().trim().optional().default(""),
    specialised_training: z.string().trim().optional().default(""),
    starting_postcode: z.string().trim().optional().default(""),
    training_agreements: z
      .array(z.literal(true))
      .length(CHARTER_AGREEMENTS.length),
    training_certificate_url: z.string().trim().optional().default(""),
    training_completed: optionalStringList,
    training_path: z.enum(["yes", "no", ""]).optional().default(""),
    transport_mode: z.string().trim().optional().default(""),
    utr_clarity_confirmed: z.boolean().optional().default(false),
    utr_document_url: z.string().trim().optional().default(""),
    utr_number: z.string().trim().optional().default(""),
    utr_path: z.enum(["have", "none", "unsure", "waiting"]),
    verification_flags: z.record(z.unknown()).optional().default({}),
    working_areas: z
      .array(z.string().trim())
      .max(MAX_WORKING_DISTRICTS - 1)
      .transform((items) =>
        items.map((item) => item.toUpperCase()).filter(Boolean),
      ),
    working_radius_miles: z.number().min(1).max(MAX_RADIUS_MILES),
    years_experience: z.number().int().min(0).max(60),
  })
  .superRefine((value, ctx) => {
    if (value.utr_path === "have") {
      if (!isValidUtr(value.utr_number ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "UTR must be exactly 10 digits",
          path: ["utr_number"],
        });
      }
      if (!value.utr_document_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Upload a document showing your UTR",
          path: ["utr_document_url"],
        });
      }
      if (!value.utr_clarity_confirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirm your name and UTR are clearly visible",
          path: ["utr_clarity_confirmed"],
        });
      }
    }

    if (value.dbs_path === "have") {
      if (!value.dbs_certificate_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter your DBS certificate number",
          path: ["dbs_certificate_number"],
        });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.dbs_issued_on ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the DBS issue date",
          path: ["dbs_issued_on"],
        });
      }
      if (!hasAnyDocument(value.dbs_document_url ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Upload at least one page of your DBS certificate",
          path: ["dbs_document_url"],
        });
      }
    }

    if (value.insurance_path === "have") {
      if (!value.insurance_provider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter your insurance provider",
          path: ["insurance_provider"],
        });
      }
      if (!value.insurance_policy_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter your policy number",
          path: ["insurance_policy_number"],
        });
      }
      if (!isAcceptableInsuranceCover(value.insurance_cover_amount ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            value.insurance_cover_amount === "other" ||
            !value.insurance_cover_amount
              ? "Enter your cover amount (minimum £1 million)"
              : "Cover must be at least £1 million Public Liability",
          path: ["insurance_cover_amount"],
        });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.insurance_expiry_date ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the policy expiry date",
          path: ["insurance_expiry_date"],
        });
      } else if (isPastDateIso(value.insurance_expiry_date ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Insurance expiry must be today or in the future",
          path: ["insurance_expiry_date"],
        });
      }
      if (!value.insurance_certificate_url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Upload your insurance certificate",
          path: ["insurance_certificate_url"],
        });
      }
    }

    if (value.insurance_path === "have") {
      if (!value.insurance_insured_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the name on your insurance policy",
          path: ["insurance_insured_name"],
        });
      }
      if (!value.insurance_activity_confirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirm your policy covers professional cleaning",
          path: ["insurance_activity_confirmed"],
        });
      }
    }

    if (
      value.emergency_relationship === "other" &&
      value.emergency_relationship_other.length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe your emergency contact's relationship to you",
        path: ["emergency_relationship_other"],
      });
    }

    {
      const travel = parseTransportModes(value.transport_mode ?? "");
      if (travel.modes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one way you usually travel to cleaning jobs",
          path: ["transport_mode"],
        });
      } else if (
        travel.modes.includes("other") &&
        travel.otherText.length < 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Describe how else you usually travel to cleaning jobs",
          path: ["transport_mode"],
        });
      }
    }

    const missingAgreements = CLEANER_AGREEMENT_DOCS.filter(
      (doc) => !value.agreement_keys.includes(doc.key),
    );
    if (missingAgreements.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Accept every agreement before submitting",
        path: ["agreement_keys"],
      });
    }
  });

/** Keep "Other" free text only when the Other chip is selected. */
function otherText(selected: string[], text: string) {
  return selected.some((item) => item.toLowerCase().startsWith("other"))
    ? text || null
    : null;
}

type AvailabilityInput = {
  day_of_week: number;
  end_time: string;
  end_time_2?: string;
  is_available: boolean;
  start_time: string;
  start_time_2?: string;
};

/** One DB row per range; unique on (cleaner, day, start, end). */
function flattenAvailability(days: AvailabilityInput[]) {
  const rows = new Map<
    string,
    {
      day_of_week: number;
      end_time: string;
      is_available: boolean;
      start_time: string;
    }
  >();
  for (const day of days) {
    const ranges = [{ end: day.end_time, start: day.start_time }];
    if (
      day.is_available &&
      day.start_time_2 &&
      day.end_time_2 &&
      day.start_time_2 < day.end_time_2
    ) {
      ranges.push({ end: day.end_time_2, start: day.start_time_2 });
    }
    for (const range of ranges) {
      rows.set(`${day.day_of_week}|${range.start}|${range.end}`, {
        day_of_week: day.day_of_week,
        end_time: range.end,
        is_available: day.is_available,
        start_time: range.start,
      });
    }
  }
  return Array.from(rows.values());
}

function reviewStatusForSubmitted(hasMaterial: boolean) {
  return hasMaterial ? ("pending" as const) : ("missing" as const);
}

export async function GET(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const taken = await listTakenInterviewSlots(user.id);
  const days = upcomingInterviewDays(new Date(), taken, 8);
  return NextResponse.json({
    slots: days.flatMap((day) =>
      day.slots.map((slot) => ({
        label: `${day.label} · ${slot.label}`,
        startsAt: slot.startsAt,
      })),
    ),
  });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role,email,stripe_account_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "cleaner") {
    return NextResponse.json({ error: "Cleaner account required" }, { status: 403 });
  }

  const { data: existingProfile } = await admin
    .from("cleaner_profiles")
    .select("onboarding_complete,verification_flags")
    .eq("id", user.id)
    .maybeSingle();
  if (existingProfile?.onboarding_complete) {
    return NextResponse.json(
      { error: "Your application has already been submitted." },
      { status: 409 },
    );
  }

  const taken = await listTakenInterviewSlots(user.id);
  if (!isBookableInterviewSlot(parsed.data.interview_scheduled_at, taken)) {
    return NextResponse.json(
      { error: "That interview time is no longer available. Choose another." },
      { status: 409 },
    );
  }

  const exam = scoreSkillsExam(parsed.data.skills_exam_answers);
  if (!exam.passed) {
    return NextResponse.json(
      {
        error: `Skills check: you scored ${exam.score}/${exam.total}. You need at least ${SKILLS_EXAM_PASS_SCORE}/${SKILLS_EXAM_QUESTIONS.length} to continue — review the questions and try again.`,
      },
      { status: 400 },
    );
  }

  let stripeOnboardingComplete = false;

  if (profile.stripe_account_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripeAccount = await getStripe().accounts.retrieve(
        profile.stripe_account_id,
      );
      stripeOnboardingComplete = Boolean(
        stripeAccount.details_submitted && stripeAccount.payouts_enabled,
      );
    } catch (stripeError) {
      Sentry.captureException(stripeError);
    }
  }

  const value = parsed.data;
  const interviewWhen = formatInterviewSlot(value.interview_scheduled_at);
  const now = new Date().toISOString();
  const agreementAcceptances = CLEANER_AGREEMENT_DOCS.filter((doc) =>
    value.agreement_keys.includes(doc.key),
  ).map((doc) => ({
    accepted_at: now,
    key: doc.key,
    version: doc.version,
  }));

  const utrSubmitted =
    value.utr_path === "have" &&
    Boolean(value.utr_number) &&
    Boolean(value.utr_document_url);
  const dbsSubmitted =
    value.dbs_path === "have" && hasAnyDocument(value.dbs_document_url);
  const insuranceSubmitted =
    value.insurance_path === "have" && Boolean(value.insurance_certificate_url);

  const verificationFlags: Record<string, unknown> = {
    ...((existingProfile?.verification_flags as Record<string, unknown> | null) ??
      {}),
    ...(value.verification_flags ?? {}),
  };
  if (value.utr_path === "have" && value.utr_number) {
    const { data: duplicateUtr } = await admin
      .from("cleaner_profiles")
      .select("id")
      .eq("utr_number", value.utr_number)
      .neq("id", user.id)
      .limit(1);
    if ((duplicateUtr ?? []).length > 0) {
      verificationFlags.duplicate_utr = true;
    }
  }
  if (
    value.insurance_path === "have" &&
    value.insurance_insured_name &&
    !namesLikelyMatch(value.full_name, value.insurance_insured_name)
  ) {
    verificationFlags.name_mismatch = true;
  }
  if (
    value.utr_path === "have" &&
    value.utr_clarity_confirmed === false
  ) {
    verificationFlags.unreadable_doc = true;
    verificationFlags.unreadable_doc_hint =
      verificationFlags.unreadable_doc_hint ??
      "Cleaner did not confirm document clarity.";
  }

  const skillsAssessmentStatus =
    value.years_experience < 1
      ? ("additional_assessment" as const)
      : ("not_required" as const);
  const equipmentStatus = "complete" as const;
  const specialistReviewRequired = false;
  const referenceProvided = Boolean(
    value.reference_name || value.reference_email || value.reference_phone,
  );
  const baseUpdate = {
      agreement_acceptances: agreementAcceptances,
      bio: value.bio,
      booking_preferences: [],
      can_transport_equipment: value.can_transport_equipment || null,
      cleaning_skills: [],
      cleaning_skills_other: null,
      dbs_certificate_number:
        value.dbs_path === "have" ? value.dbs_certificate_number || null : null,
      dbs_document_status: reviewStatusForSubmitted(dbsSubmitted),
      dbs_document_url:
        value.dbs_path === "have" ? value.dbs_document_url || null : null,
      dbs_issued_on:
        value.dbs_path === "have" && value.dbs_issued_on
          ? value.dbs_issued_on
          : null,
      dbs_path: value.dbs_path,
      emergency_contact: {
        alt_phone: value.emergency_alt_phone,
        country: value.emergency_country || "United Kingdom",
        email: value.emergency_email,
        informed: value.emergency_informed,
        mobile: value.emergency_mobile,
        name: value.emergency_name,
        relationship: value.emergency_relationship,
        relationship_other:
          value.emergency_relationship === "other"
            ? value.emergency_relationship_other
            : "",
      },
      equipment_condition: null,
      equipment_other: otherText(value.equipment_owned, value.equipment_other),
      equipment_owned: value.equipment_owned,
      equipment_ownership: value.equipment_ownership,
      equipment_status: equipmentStatus,
      equipment_transport: null,
      experience_band: value.experience_band || null,
      headshot_status: "pending",
      headshot_url: value.headshot_url,
      info_accuracy_confirmed_at: now,
      id_document_status: "pending",
      id_document_url: value.id_document_url,
      insurance_activity_confirmed:
        value.insurance_path === "have"
          ? value.insurance_activity_confirmed
          : null,
      insurance_certificate_url:
        value.insurance_path === "have"
          ? value.insurance_certificate_url || null
          : null,
      insurance_cover_amount:
        value.insurance_path === "have"
          ? normalizeInsuranceCoverAmount(value.insurance_cover_amount ?? "")
          : null,
      insurance_expiry_date:
        value.insurance_path === "have" && value.insurance_expiry_date
          ? value.insurance_expiry_date
          : null,
      insurance_insured_name:
        value.insurance_path === "have"
          ? value.insurance_insured_name || null
          : null,
      insurance_path: value.insurance_path,
      insurance_policy_number:
        value.insurance_path === "have"
          ? value.insurance_policy_number || null
          : null,
      insurance_provider:
        value.insurance_path === "have" ? value.insurance_provider || null : null,
      insurance_status: reviewStatusForSubmitted(insuranceSubmitted),
      interview_scheduled_at: value.interview_scheduled_at,
      interview_status: "awaiting",
      location_tracking_consent_at: now,
      location_tracking_consent_version:
        value.location_tracking_consent_version,
      marketing_consent_at: value.marketing_consent ? now : null,
      onboarding_complete: true,
      payout_preference: value.payout_preference,
      ppe_other: null,
      ppe_owned: [],
      preferred_hours_band: value.preferred_hours_band || null,
      prior_work_duration: null,
      prior_work_employer: null,
      prior_work_summary: null,
      prior_work_type: null,
      products_other: otherText(value.products_owned, value.products_other),
      products_owned: value.products_owned,
      products_ownership: value.products_ownership,
      reference_company: referenceProvided ? value.reference_company || null : null,
      reference_contact_ok: referenceProvided ? value.reference_contact_ok : null,
      reference_email: referenceProvided ? value.reference_email || null : null,
      reference_name: referenceProvided ? value.reference_name || null : null,
      reference_phone: referenceProvided ? value.reference_phone || null : null,
      reference_relationship: referenceProvided
        ? value.reference_relationship || null
        : null,
      safety_acknowledged_at: now,
      skills_exam_completed_at: now,
      skills_exam_passed: true,
      skills_assessment_status: skillsAssessmentStatus,
      skills_exam_score: exam.score,
      specialised_equipment: [],
      specialised_other: null,
      specialised_training: null,
      specialist_review_required: specialistReviewRequired,
      starting_postcode: null,
      status: "pending",
      stripe_onboarding_complete: stripeOnboardingComplete,
      training_certificate_url: null,
      training_completed: [],
      training_path: null,
      transport_mode: value.transport_mode || null,
      utr_document_status: reviewStatusForSubmitted(utrSubmitted),
      utr_document_url:
        value.utr_path === "have" ? value.utr_document_url || null : null,
      utr_number: value.utr_path === "have" ? value.utr_number || null : null,
      utr_path: value.utr_path,
      utr_verified: false,
      verification_flags: verificationFlags,
      // Column is integer km; fractional values make Postgres reject the whole update.
      working_radius_km: Math.max(
        1,
        Math.round(value.working_radius_miles * 1.609344),
      ),
      years_experience: value.years_experience,
  };

  let applicationReference = generateApplicationReference();
  let updateError: { code?: string; message: string } | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error } = await admin
      .from("cleaner_profiles")
      .update({ ...baseUpdate, application_reference: applicationReference })
      .eq("id", user.id);
    updateError = error;
    // 23505 = unique violation on application_reference; try a fresh code.
    if (error?.code === "23505") {
      applicationReference = generateApplicationReference();
      continue;
    }
    break;
  }
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const homePrefix = ukOutwardCode(value.home_base);
  const areaPrefixes = Array.from(
    new Set(
      [
        homePrefix,
        ukOutwardCode(value.home_base),
        ...value.working_areas.map((item) => ukOutwardCode(item))]
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
  if (areaPrefixes.length === 0) {
    return NextResponse.json(
      { error: "Add a home postcode or coverage area." },
      { status: 400 },
    );
  }

  await Promise.all([
    admin
      .from("profiles")
      .update({
        avatar_url: value.headshot_url,
        full_name: value.full_name,
        phone: value.phone,
      })
      .eq("id", user.id),
    admin.from("cleaner_services").delete().eq("cleaner_id", user.id),
    admin.from("cleaner_working_areas").delete().eq("cleaner_id", user.id),
    admin.from("cleaner_availability").delete().eq("cleaner_id", user.id),
  ]);
  await Promise.all([
    admin.from("cleaner_services").insert(
      value.services.map((service_type) => ({
        cleaner_id: user.id,
        service_type,
      })),
    ),
    admin.from("cleaner_working_areas").insert(
      areaPrefixes.map((postcode_prefix) => ({
        cleaner_id: user.id,
        latitude:
          postcode_prefix === homePrefix ? value.home_base_lat : null,
        longitude:
          postcode_prefix === homePrefix ? value.home_base_lng : null,
        postcode_prefix,
      })),
    ),
    admin.from("cleaner_availability").insert(
      flattenAvailability(value.availability).map((row) => ({
        ...row,
        cleaner_id: user.id,
      })),
    ),
  ]);

  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  await admin.from("notifications").insert([
    ...(admins ?? []).map((recipient) => ({
      body: `${value.full_name} booked a 30-minute online interview for ${interviewWhen}.`,
      data: { cleaner_id: user.id },
      title: "New cleaner application",
      type: "cleaner_application",
      user_id: recipient.id,
    })),
    {
      body: `Your 30-minute online interview is booked for ${interviewWhen}.`,
      data: { interview_scheduled_at: value.interview_scheduled_at },
      title: "Interview booked",
      type: "interview_booked",
      user_id: user.id,
    },
  ]);
  await createInAppNotification(
    user.id,
    "cleaner_application_submitted",
    "Application submitted",
    `Thanks — your application ${applicationReference} is under review. You can track progress in your dashboard.`,
    { application_reference: applicationReference },
  );
  try {
    const { data: pushProfile } = await admin
      .from("profiles")
      .select("onesignal_player_id,notification_preferences")
      .eq("id", user.id)
      .maybeSingle();
    const pushPrefs = pushProfile?.notification_preferences as
      | { push?: boolean }
      | undefined;
    if (pushPrefs?.push !== false) {
      await sendOneSignalNotification({
        body: "Your Mundoria cleaner application is under review.",
        data: { application_reference: applicationReference },
        playerId: (pushProfile?.onesignal_player_id as string | null) ?? null,
        title: "Application submitted",
      });
    }
  } catch (pushError) {
    Sentry.captureException(pushError);
  }
  await admin.from("admin_alert_queue").insert({
    body: `${value.full_name} booked a 30-minute online interview for ${interviewWhen}.`,
    data: { cleaner_id: user.id },
    title: "New cleaner application",
    type: "cleaner_application",
  });

  try {
    if (process.env.RESEND_API_KEY && profile.email) {
      await sendBrandedEmail({
        data: {
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
          firstName: value.full_name.split(" ")[0],
          fullName: value.full_name,
          applicationReference,
          interviewWhen,
          payoutPreference: value.payout_preference,
          workingAreas: areaPrefixes.join(", "),
        },
        template: "cleaner.application_submitted",
        to: profile.email,
      });
    }

    if (process.env.RESEND_API_KEY) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      await sendBrandedEmail({
        data: {
          appUrl,
          cleanerEmail: profile.email,
          cleanerName: value.full_name,
          applicationReference,
          cleanerUrl: `${appUrl}/admin/cleaners/${user.id}`,
          interviewWhen,
          yearsExperience: value.years_experience,
        },
        template: "admin.cleaner_application_submitted",
        to: resolveAdminNotificationEmail(),
      });
    }
  } catch (emailError) {
    Sentry.captureException(emailError);
  }

  await trackUserActivity({
    eventName: "cleaner_onboarding_submitted",
    metadata: {
      interviewScheduledAt: value.interview_scheduled_at,
      yearsExperience: value.years_experience,
    },
    path: "/cleaner/onboarding",
    userId: user.id,
  });

  try {
    await upsertZohoLead(
      {
        email: profile.email ?? "",
        fullName: value.full_name,
        phone: value.phone,
        userId: user.id,
      },
      {
        applicationReference,
        applicationSubmitted: true,
      },
    );
  } catch (zohoError) {
    Sentry.captureException(zohoError);
  }

  return NextResponse.json({
    application_reference: applicationReference,
    success: true,
  });
}

function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Complete every onboarding step.";
}
