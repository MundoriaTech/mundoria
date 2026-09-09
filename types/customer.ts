import type { UserRole } from "@/types/auth";

export type ServiceType =
  | "regular"
  | "one_off"
  | "deep_clean"
  | "end_of_tenancy"
  | "move_in"
  | "move_out"
  | "airbnb_turnover"
  | "holiday_let"
  | "serviced_accommodation"
  | "post_construction"
  | "office"
  | "retail_hospitality"
  | "educational_facility"
  | "communal_area"
  | "window_cleaning"
  | "pregnancy_support"
  | "postpartum"
  | "illness_recovery"
  | "post_injury"
  | "hospital_discharge"
  | "bereavement_support";

export type ServiceCategory =
  | "residential"
  | "moving_home"
  | "commercial"
  | "short_term_rental"
  | "recovery"
  /** @deprecated Removed from bookable catalogue; kept for legacy bookings. */
  | "exterior";

export type CleaningStandard = "essential" | "enhanced" | "comprehensive";

export type PropertyCondition =
  | "maintained"
  | "extra_attention"
  | "neglected";

export type RecommendationOutcome =
  | "not_shown"
  | "accepted"
  | "overridden"
  | "auto_applied";

export type BookingStatus =
  | "pending_match"
  | "matched"
  | "confirmed"
  | "cleaner_en_route"
  | "in_progress"
  | "awaiting_customer_confirmation"
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
  tier: "bronze" | "silver" | "gold" | "rose_gold" | "elite";
  rating: number;
  total_jobs: number;
  years_experience: number | null;
}

export interface BookingAddOn {
  id: string;
  booking_id: string;
  add_on_id: string;
  label: string;
  amount: number;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  cleaner_id: string | null;
  address_id: string;
  service_type: ServiceType;
  service_category: ServiceCategory | null;
  cleaning_standard: CleaningStandard;
  recommended_service_type: ServiceType | null;
  recommended_cleaning_standard: CleaningStandard | null;
  recommendation_outcome: RecommendationOutcome;
  property_condition: PropertyCondition | null;
  recently_moved: boolean | null;
  special_attention_areas: string[];
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
  add_ons?: BookingAddOn[] | null;
  cleaner?: CleanerPublicProfile | null;
}

export interface BookingChecklistItem {
  id: string;
  booking_id: string;
  item_key: string;
  label: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
}

export interface BookingCompletionConfirmation {
  id: string;
  booking_id: string;
  customer_id: string;
  all_confirmed: boolean;
  unchecked_items: Array<{
    item_key: string;
    label: string;
    reason: string;
  }>;
  notes: string | null;
  confirmed_at: string;
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
  serviceCategory: ServiceCategory | null;
  serviceType: ServiceType | null;
  cleaningStandard: CleaningStandard | null;
  propertyCondition: PropertyCondition | null;
  recentlyMoved: boolean | null;
  specialAttentionAreas: string[];
  recommendationOutcome: RecommendationOutcome;
  recommendedServiceType: ServiceType | null;
  recommendedCleaningStandard: CleaningStandard | null;
  selectedAddOns: string[];
  addressId: string | null;
  /** Collected before sign-in; persisted to /api/addresses at checkout. */
  guestAddress: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    label: string | null;
    latitude: number | null;
    longitude: number | null;
    num_bathrooms: number;
    num_bedrooms: number;
    postcode: string;
    property_type: "house" | "flat" | "office" | "other";
    special_requirements: string | null;
  } | null;
  scheduledDate: string;
  scheduledTime: string;
  /** Optional backup start times the customer can also do. */
  alternateTimes: string[];
  /** Customer-editable session length in hours (seeded from estimate). */
  estimatedDurationHours: number | null;
  isRecurring: boolean;
  recurrencePattern: "weekly" | "fortnightly" | "monthly" | null;
  preferSameCleaner: boolean;
  promoCode: string;
  specialInstructions: string;
}
