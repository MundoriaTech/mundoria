import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";

import { NO_CLEANER_REASON } from "@/lib/bookings/no-cleaner";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { schedulePriceMultiplier } from "@/lib/customer/services";
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
  offer_free_hours?: number | null;
  pause_ends_on?: string | null;
  pause_starts_on?: string | null;
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
  stripe_payment_method_id?: string | null;
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
    cleaning_standard: parent.cleaning_standard,
    commercial_spaces: parent.commercial_spaces,
    customer_id: parent.customer_id,
    estimated_duration_hours: followOnDurationHours(parent),
    cleaner_hours: followOnCleanerHours(parent),
    is_recurring: true,
    parent_booking_id: parent.id,
    payment_status: "unpaid" as const,
    stripe_payment_method_id: parent.stripe_payment_method_id ?? null,
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

function followOnGiftHours(parent: ParentBooking) {
  const gift = Number(parent.offer_free_hours ?? 0);
  return Number.isFinite(gift) && gift > 0 ? gift : 0;
}

function followOnDurationHours(parent: ParentBooking) {
  const work = Number(parent.estimated_duration_hours ?? 0);
  const billed = work - followOnGiftHours(parent);
  if (!Number.isFinite(work) || work <= 0) return parent.estimated_duration_hours;
  return Math.max(1, Number(billed.toFixed(2)));
}

function followOnCleanerHours(parent: ParentBooking) {
  if (parent.cleaner_hours == null) return parent.cleaner_hours;
  const billed = Number(parent.cleaner_hours) - followOnGiftHours(parent);
  if (!Number.isFinite(billed)) return parent.cleaner_hours;
  return Math.max(0, Number(billed.toFixed(2)));
}

type AddOnRow = { add_on_id: string; amount: number | null; label: string | null };

/**
 * A follow-on visit keeps the parent's agreed rate and add-ons, but its
 * labour is re-priced for its own day and time (a monthly series can move
 * from a weekday to a weekend). Supplies and flat add-ons are unchanged:
 * schedule multipliers never apply to them.
 */
async function followOnPricing(admin: AdminClient, parent: ParentBooking) {
  const [{ data: addOns }, pricing] = await Promise.all([
    admin
      .from("booking_add_ons")
      .select("add_on_id,amount,label")
      .eq("booking_id", parent.id),
    loadServicePricing(),
  ]);
  const rows = (addOns ?? []) as AddOnRow[];
  const addOnTotal = rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const parentTotal = Number(parent.amount_total ?? 0);
  const parentMult = schedulePriceMultiplier(
    parent.scheduled_date,
    parent.scheduled_start_time?.slice(0, 5),
    pricing,
  );
  const platformShare =
    parentTotal > 0 ? Number(parent.amount_platform ?? 0) / parentTotal : 0;

  return {
    addOns: rows,
    amountsFor(date: string) {
      if (!parentTotal) {
        return {
          amount_cleaner: parent.amount_cleaner,
          amount_platform: parent.amount_platform,
          amount_total: parent.amount_total,
        };
      }
      const labour = Math.max(0, parentTotal - addOnTotal);
      const mult = schedulePriceMultiplier(
        date,
        parent.scheduled_start_time?.slice(0, 5),
        pricing,
      );
      const total = Math.round((labour * mult) / (parentMult || 1)) + addOnTotal;
      const platform = Math.round(total * platformShare);
      return {
        amount_cleaner: total - platform,
        amount_platform: platform,
        amount_total: total,
      };
    },
  };
}

async function insertFollowOns(
  admin: AdminClient,
  parent: ParentBooking,
  dates: string[],
  pattern: ParentBooking["recurrence_pattern"],
) {
  const pricing = await followOnPricing(admin, parent);
  const rows = dates.map((date) => ({
    ...followOnRow(parent, date, pattern),
    ...pricing.amountsFor(date),
  }));
  const { data, error } = await admin.from("bookings").insert(rows).select("id");
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => row.id as string);
  if (ids.length && pricing.addOns.length) {
    const { error: addOnError } = await admin.from("booking_add_ons").insert(
      ids.flatMap((booking_id) =>
        pricing.addOns.map((row) => ({
          add_on_id: row.add_on_id,
          amount: row.amount,
          booking_id,
          label: row.label,
        })),
      ),
    );
    if (addOnError) throw new Error(addOnError.message);
  }
  return ids;
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

  if (!dates.length) return [];

  return insertFollowOns(admin, parent, dates, pattern);
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
      "id,address_id,allocated_cleaners,amount_cleaner,amount_platform,amount_total,cleaner_hours,cleaning_standard,commercial_spaces,customer_id,estimated_duration_hours,offer_free_hours,pause_ends_on,pause_starts_on,prefer_same_cleaner,preferred_cleaner_id,property_condition,recently_moved,recurrence_pattern,scheduled_date,scheduled_start_time,service_category,service_type,special_attention_areas,special_instructions,stripe_payment_method_id",
    )
    .eq("is_recurring", true)
    .is("parent_booking_id", null)
    // A visit cancelled only because no cleaner was free doesn't end the
    // customer's series.
    .or(`status.neq.cancelled,cancellation_reason.eq."${NO_CLEANER_REASON}"`)
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
      const paused =
        parent.pause_starts_on &&
        parent.pause_ends_on &&
        candidate >= parent.pause_starts_on &&
        candidate <= parent.pause_ends_on;
      if (
        candidate > today &&
        !paused &&
        !upcoming.some((child) => child.scheduled_date === candidate)
      ) {
        next = candidate;
        break;
      }
      cursor = candidate;
    }
    if (!next) continue;

    let insertedId: string | undefined;
    try {
      [insertedId] = await insertFollowOns(admin, parent, [next], pattern);
    } catch {
      insertedId = undefined;
    }
    if (insertedId) {
      created += 1;
      if (parent.stripe_payment_method_id) {
        try {
          const { runMatchingEngine } = await import("@/lib/matching/engine");
          await runMatchingEngine(insertedId);
        } catch {
          // The visit exists. Matching can be retried from admin.
        }
      }
    }
  }

  return { created };
}

export {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/fees";

export function addDaysIso(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}
