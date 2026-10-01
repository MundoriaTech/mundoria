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
  bio: null,
  cancellation_count: 0,
  certification_assessed_at: null,
  certification_assessed_by: null,
  certification_notes: null,
  certification_passed: false,
  certification_score: null,
  dbs_document_status: "missing",
  dbs_document_url: null,
  dbs_verified: false,
  headshot_status: "missing",
  headshot_url: null,
  id: "preview-cleaner",
  id_document_status: "missing",
  id_document_url: null,
  id_verified: false,
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
  rating: 0,
  skills_exam_completed_at: null,
  skills_exam_passed: false,
  skills_exam_score: null,
  status: "pending",
  stripe_onboarding_complete: false,
  tier: "bronze",
  total_jobs: 0,
  utr_number: null,
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
