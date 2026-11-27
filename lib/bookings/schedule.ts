import { bookingStartUtc } from "@/lib/payments/uk-schedule";
import {
  cancellationFeePence,
  DEFAULT_FREE_CANCEL_HOURS,
  hoursUntilBookingStart,
} from "@/lib/bookings/fees";
import { RESCHEDULE_CUTOFF_HOURS } from "@/lib/bookings/lead-time";

const SCHEDULE_CHANGE_STATUSES = [
  "pending_match",
  "matched",
  "awaiting_payment",
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
  freeCancelHours = DEFAULT_FREE_CANCEL_HOURS,
  scheduledDate,
  scheduledStartTime,
}: {
  amountTotal: number;
  freeCancelHours?: number;
  scheduledDate: string;
  scheduledStartTime: string;
}): { feePence: number; hoursLeft: number } {
  const hoursLeft = hoursUntilBookingStart(scheduledDate, scheduledStartTime);
  return {
    feePence: cancellationFeePence({
      amountTotal,
      freeCancelHours,
      hoursUntilStart: hoursLeft,
    }),
    hoursLeft,
  };
}

/**
 * Customers can change the date and time until 48 hours before the visit
 * (RESCHEDULE_CUTOFF_HOURS); after that they can only cancel.
 */
export function canCustomerReschedule({
  actualStartTime,
  checkinVerified,
  cutoffHours = RESCHEDULE_CUTOFF_HOURS,
  scheduledDate,
  scheduledStartTime,
  status,
}: {
  actualStartTime?: string | null;
  checkinVerified?: boolean | null;
  cutoffHours?: number;
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
  return (
    hoursUntilBookingStart(scheduledDate, scheduledStartTime) >= cutoffHours
  );
}

/** "I'm on my way" opens this long before the visit's UK start time. */
export const EN_ROUTE_LEAD_HOURS = 2;

/**
 * Why the cleaner can't set off yet, or null when they can. Uses the visit's
 * UK start time, whatever time zone the phone is in.
 */
export function enRouteWindowMessage({
  now = Date.now(),
  scheduledDate,
  scheduledStartTime,
}: {
  now?: number;
  scheduledDate: string;
  scheduledStartTime: string;
}) {
  const start = bookingStartUtc(scheduledDate, scheduledStartTime);
  if (!start) return null;
  const opensAt = start.getTime() - EN_ROUTE_LEAD_HOURS * 60 * 60 * 1000;
  if (now >= opensAt) return null;
  const [h, m] = String(scheduledStartTime).slice(0, 5).split(":").map(Number);
  const minutes = (((h * 60 + m - EN_ROUTE_LEAD_HOURS * 60) % 1440) + 1440) % 1440;
  const clock = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const sameDay = now >= start.getTime() - 24 * 60 * 60 * 1000;
  const day = new Date(`${scheduledDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
  return `Available from ${clock}${sameDay ? "" : ` on ${day}`}, ${EN_ROUTE_LEAD_HOURS} hours before the visit.`;
}
