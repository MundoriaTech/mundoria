import type { UserRole } from "@/types/auth";

export type ServiceType =
  | "regular"
  | "one_off"
  | "deep_clean"
  | "end_of_tenancy"
  | "airbnb_turnover"
  | "post_construction";

export type BookingStatus =
  | "pending_match"
  | "matched"
  | "confirmed"
  | "cleaner_en_route"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "disputed";

export interface Address {
  id: string;
  customer_id: string;
  label: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  property_type: "house" | "flat" | "office" | "other" | null;
  num_bedrooms: number | null;
  num_bathrooms: number | null;
  special_requirements: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleanerPublicProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  tier: "bronze" | "silver" | "gold" | "elite";
  rating: number;
  total_jobs: number;
  years_experience: number | null;
}

export interface Booking {
  id: string;
  customer_id: string;
  cleaner_id: string | null;
  address_id: string;
  service_type: ServiceType;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_start_time: string;
  estimated_duration_hours: number | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  checkin_verified: boolean;
  checkout_verified: boolean;
  is_recurring: boolean;
  recurrence_pattern: "weekly" | "fortnightly" | "monthly" | null;
  prefer_same_cleaner: boolean;
  preferred_cleaner_id: string | null;
  special_instructions: string | null;
  cancellation_reason: string | null;
  stripe_payment_intent_id: string | null;
  amount_total: number | null;
  amount_cleaner: number | null;
  amount_platform: number | null;
  payment_status: "unpaid" | "held" | "released" | "refunded";
  cleaner_live_latitude: number | null;
  cleaner_live_longitude: number | null;
  cleaner_location_updated_at: string | null;
  created_at: string;
  updated_at: string;
  address?: Address | null;
  cleaner?: CleanerPublicProfile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    role: UserRole;
  } | null;
}

export interface BookingDraft {
  serviceType: ServiceType | null;
  addressId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  isRecurring: boolean;
  recurrencePattern: "weekly" | "fortnightly" | "monthly" | null;
  preferSameCleaner: boolean;
  promoCode: string;
  specialInstructions: string;
}
