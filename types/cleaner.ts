import type { Address, Booking, ServiceType } from "@/types/customer";

export type CleanerTier = "bronze" | "silver" | "gold" | "rose_gold" | "elite";
export type CleanerStatus =
  | "pending"
  | "in_training"
  | "certified"
  | "active"
  | "suspended"
  | "removed";

export type DocumentReviewStatus =
  | "missing"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export type InterviewStatus =
  | "not_started"
  | "awaiting"
  | "completed"
  | "failed";

export interface CleanerProfile {
  id: string;
  bio: string | null;
  years_experience: number | null;
  tier: CleanerTier;
  performance_score: number;
  rating: number;
  total_jobs: number;
  medallion_score: number;
  medallion_under_review_at: string | null;
  acceptance_rate: number;
  on_time_rate: number;
  cancellation_count: number;
  no_show_count: number;
  gender: "woman" | "man" | null;
  dbs_verified: boolean;
  dbs_document_url: string | null;
  dbs_document_status: DocumentReviewStatus;
  dbs_path: string | null;
  dbs_certificate_number: string | null;
  dbs_issued_on: string | null;
  id_verified: boolean;
  id_document_url: string | null;
  id_document_status: DocumentReviewStatus;
  headshot_url: string | null;
  headshot_status: DocumentReviewStatus;
  utr_number: string | null;
  utr_verified: boolean;
  utr_path: string | null;
  utr_document_url: string | null;
  utr_document_status: DocumentReviewStatus;
  insurance_path: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_cover_amount: string | null;
  insurance_expiry_date: string | null;
  insurance_certificate_url: string | null;
  insurance_status: DocumentReviewStatus;
  experience_band: string | null;
  cleaning_skills: string[];
  cleaning_skills_other: string | null;
  prior_work_type: string | null;
  prior_work_employer: string | null;
  prior_work_duration: string | null;
  prior_work_summary: string | null;
  training_path: string | null;
  training_completed: string[];
  training_certificate_url: string | null;
  reference_name: string | null;
  reference_company: string | null;
  reference_relationship: string | null;
  reference_email: string | null;
  reference_phone: string | null;
  reference_contact_ok: boolean | null;
  starting_postcode: string | null;
  preferred_hours_band: string | null;
  transport_mode: string | null;
  can_transport_equipment: string | null;
  booking_preferences: string[];
  equipment_ownership: string | null;
  equipment_owned: string[];
  equipment_other: string | null;
  equipment_condition: string | null;
  products_ownership: string | null;
  products_owned: string[];
  products_other: string | null;
  ppe_owned: string[];
  ppe_other: string | null;
  equipment_transport: string | null;
  specialised_equipment: string[];
  specialised_other: string | null;
  specialised_training: string | null;
  insurance_insured_name: string | null;
  insurance_activity_confirmed: boolean | null;
  application_reference: string | null;
  marketing_consent_at: string | null;
  info_accuracy_confirmed_at: string | null;
  verification_flags: Record<string, unknown>;
  skills_assessment_status: string | null;
  equipment_status: string | null;
  specialist_review_required: boolean;
  emergency_contact: Record<string, string> | null;
  safety_acknowledged_at: string | null;
  agreement_acceptances: Array<{
    accepted_at: string;
    key: string;
    version: string;
  }>;
  interview_status: InterviewStatus;
  interview_scheduled_at: string | null;
  interview_notes: string | null;
  interview_completed_at: string | null;
  interview_completed_by: string | null;
  skills_exam_passed: boolean;
  skills_exam_score: number | null;
  skills_exam_completed_at: string | null;
  onboarding_complete: boolean;
  status: CleanerStatus;
  certification_score: number | null;
  certification_notes: string | null;
  certification_passed: boolean;
  certification_assessed_by: string | null;
  certification_assessed_at: string | null;
  location_tracking_consent_at: string | null;
  location_tracking_consent_version: string | null;
  payout_preference: "weekly" | "monthly";
  stripe_onboarding_complete: boolean;
  working_radius_km: number;
}

export interface CleanerService {
  id: string;
  cleaner_id: string;
  service_type: ServiceType;
  is_active: boolean;
}

export interface CleanerArea {
  id: string;
  cleaner_id: string;
  postcode_prefix: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CleanerAvailability {
  id: string;
  cleaner_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface CleanerJob extends Booking {
  address?: Address | null;
  customer?: {
    full_name: string;
    phone: string | null;
    avatar_url?: string | null;
  } | null;
  /** When this cleaner must answer the current offer. */
  offer_expires_at?: string | null;
}

export interface PerformanceHistory {
  id: string;
  month: string;
  total_score: number;
  jobs_completed: number;
  tier_before: CleanerTier;
  tier_after: CleanerTier;
}

export type RatingMood = "excellent" | "good" | "fair" | "bad" | "awful";
export type RatingApplicationStatus =
  | "pending_hold"
  | "disputed"
  | "applied"
  | "voided";

export interface CleanerMedallionEvent {
  id: string;
  cleaner_id: string;
  rating_id: string | null;
  changed_by: string | null;
  event_type:
    | "rating_applied"
    | "rating_voided"
    | "tier_changed"
    | "manual_adjustment"
    | "certification_passed"
    | "certification_failed"
    | "under_review";
  score_delta: number;
  score_before: number | null;
  score_after: number | null;
  tier_before: CleanerTier | null;
  tier_after: CleanerTier | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  total_jobs: number;
  gross_amount: number;
  net_amount: number;
  status: "pending" | "processing" | "paid" | "failed";
  processed_at: string | null;
  created_at: string;
}
