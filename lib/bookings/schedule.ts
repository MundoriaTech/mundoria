import {
  cancellationFeePence,
  hoursUntilBookingStart,
} from "@/lib/bookings/recurring";

const SCHEDULE_CHANGE_STATUSES = [
  "pending_match",
  "matched",
  "confirmed",
] as const;

export type ScheduleChangeStatus = (typeof SCHEDULE_CHANGE_STATUSES)[number];

export function isScheduleChangeStatus(
  status: string,
): status is ScheduleChangeStatus {
  return (SCHEDULE_CHANGE_STATUSES as readonly string[]).includes(status);
}

/** Customer may cancel or reschedule while the visit is still upcoming. */
export function canCustomerChangeSchedule({
  scheduledDate,
  scheduledStartTime,
  status,
}: {
  scheduledDate: string;
  scheduledStartTime: string;
  status: string;
}): boolean {
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
  scheduledDate,
  scheduledStartTime,
  status,
}: {
  scheduledDate: string;
  scheduledStartTime: string;
  status: string;
}): boolean {
  if (!canCustomerChangeSchedule({
    scheduledDate,
    scheduledStartTime,
    status,
  })) {
    return false;
  }
  return hoursUntilBookingStart(scheduledDate, scheduledStartTime) >= 24;
}
