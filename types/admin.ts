import type { Booking, BookingStatus, ServiceType } from "@/types/customer";

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
    tier: "bronze" | "silver" | "gold" | "elite";
    rating: number;
    total_jobs: number;
    status: "pending" | "active" | "suspended" | "removed";
    onboarding_complete: boolean;
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
