import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type ParentBooking = {
  address_id: string;
  allocated_cleaners: number | null;
  amount_cleaner: number | null;
  amount_platform: number | null;
  amount_total: number | null;
  cleaner_hours: number | null;
  cleaning_standard: string | null;
  commercial_spaces: unknown;
  customer_id: string;
  estimated_duration_hours: number | null;
  id: string;
  prefer_same_cleaner: boolean | null;
  property_condition: string | null;
  recently_moved: boolean | null;
  recurrence_pattern: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  service_category: string | null;
  service_type: string;
  special_attention_areas: string[] | null;
  special_instructions: string | null;
};

const SERIES_LENGTH = 8;

function nextDates(
  startDate: string,
  pattern: "weekly" | "fortnightly" | "monthly" | "custom" | null,
  customDates: string[],
): string[] {
  if (pattern === "custom") {
    return customDates
      .filter((date) => date > startDate)
      .slice(0, SERIES_LENGTH);
  }

  const start = parseISO(startDate);
  const dates: string[] = [];
  for (let i = 1; i <= SERIES_LENGTH; i += 1) {
    const next =
      pattern === "monthly"
        ? addMonths(start, i)
        : pattern === "fortnightly"
          ? addWeeks(start, i * 2)
          : addWeeks(start, i);
    dates.push(format(next, "yyyy-MM-dd"));
  }
  return dates;
}

/**
 * Creates unpaid follow-on bookings for a recurring series.
 * Only the parent booking is payment-authorised at checkout; later visits
 * collect payment closer to the appointment (or via a future subscription flow).
 */
export async function createRecurringFollowOnBookings({
  admin,
  customDates,
  parent,
  pattern,
}: {
  admin: AdminClient;
  customDates: string[];
  parent: ParentBooking;
  pattern: "weekly" | "fortnightly" | "monthly" | "custom" | null;
}) {
  const dates = nextDates(parent.scheduled_date, pattern, customDates);
  if (!dates.length) return;

  const rows = dates.map((scheduled_date) => ({
    address_id: parent.address_id,
    allocated_cleaners: parent.allocated_cleaners ?? 1,
    amount_cleaner: parent.amount_cleaner,
    amount_platform: parent.amount_platform,
    amount_total: parent.amount_total,
    cleaner_hours: parent.cleaner_hours,
    cleaning_standard: parent.cleaning_standard,
    commercial_spaces: parent.commercial_spaces,
    customer_id: parent.customer_id,
    estimated_duration_hours: parent.estimated_duration_hours,
    is_recurring: true,
    parent_booking_id: parent.id,
    payment_status: "unpaid" as const,
    prefer_same_cleaner: parent.prefer_same_cleaner ?? false,
    property_condition: parent.property_condition,
    recently_moved: parent.recently_moved,
    recurrence_pattern: pattern,
    scheduled_date,
    scheduled_start_time: parent.scheduled_start_time,
    service_category: parent.service_category,
    service_type: parent.service_type,
    special_attention_areas: parent.special_attention_areas ?? [],
    special_instructions: parent.special_instructions,
    status: "pending_match" as const,
  }));

  const { error } = await admin.from("bookings").insert(rows);
  if (error) throw new Error(error.message);
}

/** Soft cancellation fee window: free >48h, 50% within 48h, 100% within 24h. */
export function cancellationFeePence({
  amountTotal,
  hoursUntilStart,
}: {
  amountTotal: number;
  hoursUntilStart: number;
}): number {
  if (hoursUntilStart >= 48) return 0;
  if (hoursUntilStart >= 24) return Math.round(amountTotal * 0.5);
  return amountTotal;
}

export function hoursUntilBookingStart(date: string, time: string): number {
  const start = new Date(`${date}T${time}:00`);
  return (start.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function addDaysIso(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}
