/**
 * Date rules for the cleaner diary ("Add a plan" and "Take time off").
 * Shared by the diary board and the API routes so both give the same message.
 */

/** A plan may start a few minutes ago (time to fill the form in). */
export const PLAN_START_GRACE_MS = 5 * 60 * 1000;

/** Today's calendar date in the UK, as YYYY-MM-DD. */
export function ukTodayIso(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).format(now);
}

export function diaryPlanError(
  startsAt: string,
  endsAt: string,
  now: Date = new Date(),
): string | null {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Choose when the plan starts and ends.";
  }
  if (start < now.getTime() - PLAN_START_GRACE_MS) {
    return "That start time has passed. Choose a time from now on.";
  }
  if (end <= start) {
    return "The plan has to end after it starts.";
  }
  return null;
}

/** `today` is YYYY-MM-DD: the UK date on the server, the device date in the browser. */
export function absenceError(startsOn: string, endsOn: string, today: string): string | null {
  if (!startsOn || !endsOn) {
    return "Choose the first and last day you will be away.";
  }
  if (startsOn < today) {
    return "Time off cannot start on a day that has passed. Choose today or later.";
  }
  if (endsOn < startsOn) {
    return "The last day has to be on or after the first day.";
  }
  return null;
}
