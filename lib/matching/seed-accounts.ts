import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Seed / load-test accounts share the live database (scripts/seed-e2e.mjs).
 * They must never touch real work: seed cleaners only ever see seed
 * customers' bookings, and real cleaners only ever see real bookings.
 * The database enforces the same rule (migration
 * 20261125120000_seed_account_isolation.sql); this is the app-side filter so
 * matching never even tries.
 */
export const SEED_EMAIL_DOMAIN = "@seed.mundoria.local";

export function isSeedEmail(email?: string | null) {
  return Boolean(email?.trim().toLowerCase().endsWith(SEED_EMAIL_DOMAIN));
}

/** Seed customers' bookings go to seed cleaners; everyone else's to real ones. */
export function sameAudience(
  customerEmail: string | null | undefined,
  cleanerEmail: string | null | undefined,
) {
  return isSeedEmail(customerEmail) === isSeedEmail(cleanerEmail);
}

/** Keep only the cleaner ids allowed to work on this booking. */
export async function filterCleanersForBooking(
  admin: SupabaseClient,
  bookingId: string,
  cleanerIds: string[],
) {
  if (!cleanerIds.length) return [] as string[];
  const { data: booking } = await admin
    .from("bookings")
    .select("customer:profiles!bookings_customer_id_fkey(email)")
    .eq("id", bookingId)
    .maybeSingle();
  const customer = Array.isArray(booking?.customer)
    ? booking?.customer[0]
    : booking?.customer;
  const customerEmail = (customer as { email?: string | null } | null)?.email;

  const allowed = new Set<string>();
  for (let i = 0; i < cleanerIds.length; i += 200) {
    const { data } = await admin
      .from("profiles")
      .select("id,email")
      .in("id", cleanerIds.slice(i, i + 200));
    for (const row of data ?? []) {
      if (sameAudience(customerEmail, row.email as string | null)) {
        allowed.add(row.id as string);
      }
    }
  }
  return cleanerIds.filter((id) => allowed.has(id));
}
