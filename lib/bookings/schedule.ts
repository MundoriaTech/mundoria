import {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/fees";

const SCHEDULE_CHANGE_STATUSES = [
  "pending_match",
  "matched",
  "confirmed",
  "cleaner_en_route",
] as const;

const CHECK_IN_LEAD_MS = 60 * 60 * 1000;
const CHECK_IN_GRACE_MS = 60 * 60 * 1000;

export type ScheduleChangeStatus = (typeof SCHEDULE_CHANGE_STATUSES)[number];

export function isScheduleChangeStatus(
  status: string,
): status is ScheduleChangeStatus {
  return (SCHEDULE_CHANGE_STATUSES as readonly string[]).includes(status);
}

/** A clean has started only after a recorded check-in, not from status alone. */
export function visitHasStarted({
  actualStartTime,
  checkinVerified,
}: {
  actualStartTime?: string | null;
  checkinVerified?: boolean | null;
}) {
  return Boolean(checkinVerified) || Boolean(actualStartTime);
}

/** Check-in is open from 60 minutes before the start until an hour after the booked duration. */
export function checkInWindowMessage({
  estimatedDurationHours,
  now = Date.now(),
  scheduledDate,
  scheduledStartTime,
}: {
  estimatedDurationHours?: number | null;
  now?: number;
  scheduledDate: string;
  scheduledStartTime: string;
}) {
  const clock = scheduledStartTime.trim().slice(0, 5);
  const start = new Date(`${scheduledDate}T${clock}:00`).getTime();
  if (Number.isNaN(start)) return "This visit has no valid start time.";
  const durationMs =
    Math.max(1, Number(estimatedDurationHours ?? 2)) * 60 * 60 * 1000;
  if (now < start - CHECK_IN_LEAD_MS) {
    return "Check-in opens 60 minutes before the visit.";
  }
  if (now > start + durationMs + CHECK_IN_GRACE_MS) {
    return "This visit window has passed.";
  }
  return null;
}

/** Customer may cancel or reschedule any service while the visit is still ahead and has not started. */
export function canCustomerChangeSchedule({
  actualStartTime,
  checkinVerified,
  scheduledDate,
  scheduledStartTime,
  status,
}: {
  actualStartTime?: string | null;
  checkinVerified?: boolean | null;
  scheduledDate: string;
  scheduledStartTime: string;
  status: string;
}): boolean {
  if (visitHasStarted({ actualStartTime, checkinVerified })) return false;
  if (!isScheduleChangeStatus(status)) return false;
  return hoursUntilBookingStart(scheduledDate, scheduledStartTime) > 0;
}

export function scheduleChangeFeePreview({
  amountTotal,
  scheduledDate,
  scheduledStartTime,
}: {
  amountTotal: number;
  scheduledDate: string;
  scheduledStartTime: string;
}): { feePence: number; hoursLeft: number } {
  const hoursLeft = hoursUntilBookingStart(scheduledDate, scheduledStartTime);
  return {
    feePence: cancellationFeePence({ amountTotal, hoursUntilStart: hoursLeft }),
    hoursLeft,
  };
}

/** Reschedule is free when ≥24h out; otherwise redirect to cancel+rebook. */
export function canCustomerReschedule({
  actualStartTime,
  checkinVerified,
  scheduledDate,
  scheduledStartTime,
  status,
}: {
  actualStartTime?: string | null;
  checkinVerified?: boolean | null;
  scheduledDate: string;
  scheduledStartTime: string;
  status: string;
}): boolean {
  if (!canCustomerChangeSchedule({
    actualStartTime,
    checkinVerified,
    scheduledDate,
    scheduledStartTime,
    status,
  })) {
    return false;
  }
  return hoursUntilBookingStart(scheduledDate, scheduledStartTime) >= 24;
}
