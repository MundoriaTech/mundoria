import type { Booking, BookingStatus, ServiceType } from "@/types/customer";
import type { CleanerStatus, CleanerTier } from "@/types/cleaner";

export interface AdminBooking extends Booking {
  customer?: { full_name: string; email?: string } | null;
  cleaner_profile?: { full_name: string } | null;
}

export interface AdminCleaner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  cleaner_profiles: {
    tier: CleanerTier;
    rating: number;
    total_jobs: number;
    medallion_score: number;
    status: CleanerStatus;
    onboarding_complete: boolean;
    certification_score?: number | null;
    certification_passed?: boolean;
    bio?: string | null;
    years_experience?: number | null;
  } | null;
}

export interface AdminDispute {
  id: string;
  booking_id: string;
  type: "damage" | "no_show" | "quality" | "payment" | "other";
  description: string;
  evidence_urls: string[];
  status: "open" | "under_review" | "resolved" | "closed";
  resolution_notes: string | null;
  rating_id?: string | null;
  category_path?: string[];
  selected_option_key?: string | null;
  structured_metadata?: Record<string, unknown>;
  created_at: string;
  booking?: AdminBooking | null;
  raised_by_profile?: { full_name: string } | null;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface BookingFilter {
  status?: BookingStatus;
  service?: ServiceType;
}
