import type { Address, Booking, ServiceType } from "@/types/customer";

export type CleanerTier = "bronze" | "silver" | "gold" | "elite";

export interface CleanerProfile {
  id: string;
  bio: string | null;
  years_experience: number | null;
  tier: CleanerTier;
  performance_score: number;
  rating: number;
  total_jobs: number;
  acceptance_rate: number;
  on_time_rate: number;
  cancellation_count: number;
  no_show_count: number;
  dbs_verified: boolean;
  dbs_document_url: string | null;
  dbs_document_status: "missing" | "pending" | "verified" | "rejected";
  id_verified: boolean;
  id_document_url: string | null;
  id_document_status: "missing" | "pending" | "verified" | "rejected";
  onboarding_complete: boolean;
  status: "pending" | "active" | "suspended" | "removed";
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
  customer?: { full_name: string; phone: string | null } | null;
}

export interface PerformanceHistory {
  id: string;
  month: string;
  total_score: number;
  jobs_completed: number;
  tier_before: CleanerTier;
  tier_after: CleanerTier;
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
