/** Default free-cancel window; the live value is the admin "Free-cancel deadline". */
export const DEFAULT_FREE_CANCEL_HOURS = 24;

/** Free at or beyond the free-cancel window; full amount inside it. */
export function cancellationFeePence({
  amountTotal,
  freeCancelHours = DEFAULT_FREE_CANCEL_HOURS,
  hoursUntilStart,
}: {
  amountTotal: number;
  freeCancelHours?: number;
  hoursUntilStart: number;
}): number {
  if (hoursUntilStart >= freeCancelHours) return 0;
  return amountTotal;
}

export function hoursUntilBookingStart(date: string, time: string): number {
  const clock = time.trim().slice(0, 5);
  const start = new Date(`${date}T${clock}:00`);
  if (Number.isNaN(start.getTime())) return Number.NEGATIVE_INFINITY;
  return (start.getTime() - Date.now()) / (1000 * 60 * 60);
}
