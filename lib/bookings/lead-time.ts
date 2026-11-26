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
