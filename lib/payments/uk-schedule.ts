/** UK (Europe/London) helpers for payment capture scheduling. */

export const PAYMENT_TIME_ZONE = "Europe/London";

export function londonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: PAYMENT_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { day: value("day"), month: value("month"), year: value("year") };
}

export function addCalendarDays(
  date: { day: number; month: number; year: number },
  days: number,
) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

/** Convert a Europe/London wall-clock local time to a UTC Date. */
export function londonLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: PAYMENT_TIME_ZONE,
    year: "numeric",
  }).formatToParts(utcGuess);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour") % 24,
    value("minute"),
    value("second"),
  );
  return new Date(utcGuess.getTime() - (asUtc - utcGuess.getTime()));
}

/** Booking start instant (scheduled date+time treated as London local). */
export function bookingStartUtc(
  scheduledDate: string,
  scheduledStartTime: string,
) {
  const [year, month, day] = scheduledDate.split("-").map(Number);
  const clock = scheduledStartTime.trim().slice(0, 5);
  const [hour, minute] = clock.split(":").map(Number);
  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }
  return londonLocalToUtc(year, month, day, hour, minute);
}

/**
 * Next UK calendar day after `from`, at the configured local hour/minute.
 * Used to schedule capture after a clean completes.
 */
export function nextDayCaptureAtUk({
  from = new Date(),
  hour,
  minute,
}: {
  from?: Date;
  hour: number;
  minute: number;
}) {
  const today = londonDateParts(from);
  const next = addCalendarDays(today, 1);
  return londonLocalToUtc(next.year, next.month, next.day, hour, minute);
}
