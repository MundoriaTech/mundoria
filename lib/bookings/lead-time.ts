/**
 * Bookings, and rescheduled visits, need this much notice before the start.
 * Kept out of client components so server routes can enforce it too.
 */
export const BOOKING_MIN_LEAD_HOURS = 48;

/** Hours from now until a UK-local date and start time. */
export function hoursFromNow(date: string, time: string, now: Date = new Date()) {
  const start = new Date(`${date}T${time.trim().slice(0, 5)}:00`);
  if (Number.isNaN(start.getTime())) return Number.NEGATIVE_INFINITY;
  return (start.getTime() - now.getTime()) / (1000 * 60 * 60);
}

/**
 * Customers can change a visit's date and time only while it is at least this
 * far away. Separate from the admin free-cancel deadline (cancellation fees
 * and card-hold timing), which stays where it is.
 */
export const RESCHEDULE_CUTOFF_HOURS = 48;

/**
 * TEMPORARY test exception (26 Nov 2026): bookings by these customers can be
 * rescheduled at any time, to any future time including the same day,
 * skipping both 48-hour rules. Remove once the test is done.
 */
const RESCHEDULE_TEST_CUSTOMER_IDS = new Set<string>([
  "5af11b68-8ae3-4a5f-ab2f-2bc476e5a4ae", // bosoye, testing with Maritha Miracle
]);

export function isRescheduleTestCustomer(customerId: string | null | undefined) {
  return Boolean(customerId && RESCHEDULE_TEST_CUSTOMER_IDS.has(customerId));
}
