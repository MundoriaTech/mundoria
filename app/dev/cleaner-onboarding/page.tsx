import { notFound } from "next/navigation";

import { OnboardingWizard } from "@/components/cleaner/onboarding-wizard";
import { listTakenInterviewSlots } from "@/lib/cleaner/interview-availability";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";

const profile: Profile = {
  avatar_url: null,
  created_at: "2026-10-01T00:00:00.000Z",
  email: "preview.cleaner@mundoria.local",
  full_name: "",
  id: "preview-cleaner",
  notification_preferences: { email: true, push: true, sms: false },
  onesignal_player_id: null,
  phone: "",
  referral_code: "PREVIEW",
  referred_by: null,
  role: "cleaner",
  stripe_account_id: null,
  stripe_customer_id: null,
  updated_at: "2026-10-01T00:00:00.000Z",
};

const cleaner: CleanerProfile = {
  acceptance_rate: 0,
  agreement_acceptances: [],
  application_reference: null,
  cleaning_skills_other: null,
  equipment_other: null,
  equipment_status: null,
  info_accuracy_confirmed_at: null,
  insurance_activity_confirmed: null,
  insurance_insured_name: null,
  marketing_consent_at: null,
  ppe_other: null,
  preferred_hours_band: null,
  products_other: null,
  reference_company: null,
  reference_contact_ok: null,
  reference_email: null,
  reference_name: null,
  reference_phone: null,
  reference_relationship: null,
  skills_assessment_status: null,
  specialised_other: null,
  specialist_review_required: false,
  starting_postcode: null,
  training_certificate_url: null,
  training_completed: [],
  training_path: null,
  verification_flags: {},
  bio: null,
  booking_preferences: [],
  can_transport_equipment: null,
  cancellation_count: 0,
  certification_assessed_at: null,
  certification_assessed_by: null,
  certification_notes: null,
  certification_passed: false,
  certification_score: null,
  cleaning_skills: [],
  dbs_certificate_number: null,
  dbs_document_status: "missing",
  dbs_document_url: null,
  dbs_issued_on: null,
  dbs_path: null,
  dbs_verified: false,
  emergency_contact: null,
  equipment_condition: null,
  equipment_owned: [],
  equipment_ownership: null,
  equipment_transport: null,
  experience_band: null,
  gender: null,
  headshot_status: "missing",
  headshot_url: null,
  id: "preview-cleaner",
  id_document_status: "missing",
  id_document_url: null,
  id_verified: false,
  insurance_certificate_url: null,
  insurance_cover_amount: null,
  insurance_expiry_date: null,
  insurance_path: null,
  insurance_policy_number: null,
  insurance_provider: null,
  insurance_status: "missing",
  interview_completed_at: null,
  interview_completed_by: null,
  interview_notes: null,
  interview_scheduled_at: null,
  interview_status: "not_started",
  location_tracking_consent_at: null,
  location_tracking_consent_version: null,
  medallion_score: 0,
  medallion_under_review_at: null,
  no_show_count: 0,
  on_time_rate: 0,
  onboarding_complete: false,
  payout_preference: "weekly",
  performance_score: 0,
  ppe_owned: [],
  prior_work_duration: null,
  prior_work_employer: null,
  prior_work_summary: null,
  prior_work_type: null,
  products_owned: [],
  products_ownership: null,
  rating: 0,
  safety_acknowledged_at: null,
  skills_exam_completed_at: null,
  skills_exam_passed: false,
  skills_exam_score: null,
  specialised_equipment: [],
  specialised_training: null,
  status: "pending",
  stripe_onboarding_complete: false,
  tier: "bronze",
  total_jobs: 0,
  transport_mode: null,
  utr_document_status: "missing",
  utr_document_url: null,
  utr_number: null,
  utr_path: null,
  utr_verified: false,
  working_radius_km: 24,
  years_experience: 0,
};

export default async function CleanerOnboardingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const takenSlots = await loadTakenInterviewSlots();
  return (
    <OnboardingWizard
      cleaner={cleaner}
      preview
      profile={profile}
      takenSlots={takenSlots}
    />
  );
}

async function loadTakenInterviewSlots() {
  try {
    return await listTakenInterviewSlots();
  } catch {
    return [];
  }
}
