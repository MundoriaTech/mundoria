import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ParentBooking = {
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
  preferred_cleaner_id?: string | null;
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

/** How many unpaid future visits to keep queued ahead of the latest booking. */
const FOLLOW_ON_BUFFER = 1;

function nextDateAfter(
  startDate: string,
  pattern: "weekly" | "fortnightly" | "monthly" | "custom" | null,
  customDates: string[],
): string | null {
  if (pattern === "custom") {
    return customDates.find((date) => date > startDate) ?? null;
  }

  const start = parseISO(startDate);
  if (pattern === "monthly") {
    return format(addMonths(start, 1), "yyyy-MM-dd");
  }
  if (pattern === "fortnightly") {
    return format(addWeeks(start, 2), "yyyy-MM-dd");
  }
  // weekly (default for required recurring)
  return format(addWeeks(start, 1), "yyyy-MM-dd");
}

function followOnRow(
  parent: ParentBooking,
  scheduled_date: string,
  pattern: ParentBooking["recurrence_pattern"],
) {
  return {
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
    preferred_cleaner_id: parent.preferred_cleaner_id ?? null,
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
  };
}

/**
 * Creates unpaid follow-on booking(s) after checkout.
 * - weekly / fortnightly / monthly: only the next visit (rolled forward by cron)
 * - custom: every extra date the customer explicitly selected
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
  const dates =
    pattern === "custom"
      ? customDates
          .filter((date) => date > parent.scheduled_date)
          .slice(0, 24)
      : (() => {
          const next = nextDateAfter(
            parent.scheduled_date,
            pattern,
            customDates,
          );
          return next ? [next] : [];
        })();

  if (!dates.length) return;

  const rows = dates.map((scheduled_date) =>
    followOnRow(parent, scheduled_date, pattern),
  );

  const { error } = await admin.from("bookings").insert(rows);
  if (error) throw new Error(error.message);
}

/**
 * Keeps a small buffer of future unpaid follow-ons for active recurring parents
 * so checkout never needs to insert a long series in one shot.
 */
export async function ensureUpcomingRecurringFollowOns(
  admin: AdminClient,
  options?: { limit?: number },
) {
  const limit = options?.limit ?? 50;
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: parents, error } = await admin
    .from("bookings")
    .select(
      "id,address_id,allocated_cleaners,amount_cleaner,amount_platform,amount_total,cleaner_hours,cleaning_standard,commercial_spaces,customer_id,estimated_duration_hours,prefer_same_cleaner,preferred_cleaner_id,property_condition,recently_moved,recurrence_pattern,scheduled_date,scheduled_start_time,service_category,service_type,special_attention_areas,special_instructions",
    )
    .eq("is_recurring", true)
    .is("parent_booking_id", null)
    .neq("status", "cancelled")
    .not("recurrence_pattern", "is", null)
    .neq("recurrence_pattern", "custom")
    .limit(limit);

  if (error) throw new Error(error.message);

  let created = 0;

  for (const parent of (parents ?? []) as ParentBooking[]) {
    const pattern = parent.recurrence_pattern as
      | "weekly"
      | "fortnightly"
      | "monthly"
      | "custom"
      | null;

    const { data: children } = await admin
      .from("bookings")
      .select("id,scheduled_date,status")
      .eq("parent_booking_id", parent.id)
      .neq("status", "cancelled")
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true });

    const upcoming = children ?? [];
    if (upcoming.length >= FOLLOW_ON_BUFFER) continue;

    // Walk the cadence from the parent date so we stay aligned with the series.
    let cursor = parent.scheduled_date;
    let next: string | null = null;
    for (let i = 0; i < 52; i += 1) {
      const candidate = nextDateAfter(cursor, pattern, []);
      if (!candidate) break;
      if (
        candidate > today &&
        !upcoming.some((child) => child.scheduled_date === candidate)
      ) {
        next = candidate;
        break;
      }
      cursor = candidate;
    }
    if (!next) continue;

    const { error: insertError } = await admin
      .from("bookings")
      .insert(followOnRow(parent, next, pattern));
    if (!insertError) created += 1;
  }

  return { created };
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
