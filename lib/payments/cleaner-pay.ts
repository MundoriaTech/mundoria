/**
 * Cleaners are paid a flat hourly rate for every hour they work, whatever the
 * customer paid (discounts, free first-visit hours and weekend uplifts don't
 * change it). Mundoria keeps the rest of the booking total.
 */
export const CLEANER_HOURLY_RATE_PENCE = 1300;

type PayHours = {
  allocatedCleaners?: number | null;
  /** Total cleaner-hours across the team (office quotes); wins when set. */
  cleanerHours?: number | null;
  estimatedDurationHours?: number | null;
};

/** Paid cleaner-hours on a booking, summed across every cleaner on it. */
export function paidCleanerHours({
  allocatedCleaners,
  cleanerHours,
  estimatedDurationHours,
}: PayHours) {
  const team = Number(cleanerHours ?? 0);
  if (Number.isFinite(team) && team > 0) return team;
  const hours = Number(estimatedDurationHours ?? 0);
  const cleaners = Math.max(1, Number(allocatedCleaners ?? 1) || 1);
  return Number.isFinite(hours) && hours > 0 ? hours * cleaners : 0;
}

/** What the cleaners on a booking earn between them, in pence. */
export function cleanerPayPence(hours: PayHours) {
  return Math.round(paidCleanerHours(hours) * CLEANER_HOURLY_RATE_PENCE);
}

/** A booking's cleaner and platform split for a given customer total. */
export function splitBookingAmount(totalPence: number, hours: PayHours) {
  const cleaner = cleanerPayPence(hours);
  return { amount_cleaner: cleaner, amount_platform: totalPence - cleaner };
}

/** What one cleaner earns for extra minutes on the day, in pence. */
export function extraTimeCleanerPence(minutes: number) {
  return Math.round((CLEANER_HOURLY_RATE_PENCE * Math.max(0, minutes)) / 60);
}
