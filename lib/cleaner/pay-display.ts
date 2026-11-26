import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admins can set what one cleaner is shown as their pay on one booking
 * (booking_cleaner_pay_display). It changes only what that cleaner sees in
 * the app and in job emails; payouts still use bookings.amount_cleaner.
 */
async function loadOverrides(bookingIds: string[], cleanerId: string) {
  if (!bookingIds.length) return new Map<string, number>();
  const { data } = await createAdminClient()
    .from("booking_cleaner_pay_display")
    .select("booking_id,display_pence")
    .eq("cleaner_id", cleanerId)
    .in("booking_id", bookingIds);
  return new Map(
    (data ?? []).map((row) => [row.booking_id as string, Number(row.display_pence)]),
  );
}

/** Replace amount_cleaner with this cleaner's displayed pay where one is set. */
export async function applyCleanerPayDisplay<
  T extends { amount_cleaner?: number | null; id: string },
>(jobs: T[], cleanerId: string): Promise<T[]> {
  const overrides = await loadOverrides(
    jobs.map((job) => job.id),
    cleanerId,
  ).catch(() => new Map<string, number>());
  if (!overrides.size) return jobs;
  return jobs.map((job) =>
    overrides.has(job.id)
      ? { ...job, amount_cleaner: overrides.get(job.id)! }
      : job,
  );
}

/** This cleaner's displayed pay for one booking, or the real pay if none is set. */
export async function cleanerPayForDisplay(
  bookingId: string,
  cleanerId: string,
  actualPence: number | null,
) {
  const overrides = await loadOverrides([bookingId], cleanerId).catch(
    () => new Map<string, number>(),
  );
  return overrides.has(bookingId) ? overrides.get(bookingId)! : actualPence;
}
