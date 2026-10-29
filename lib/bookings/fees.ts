/** Soft cancellation fee window: free at 24h or more; full amount within 24h. */
export function cancellationFeePence({
  amountTotal,
  hoursUntilStart,
}: {
  amountTotal: number;
  hoursUntilStart: number;
}): number {
  if (hoursUntilStart >= 24) return 0;
  return amountTotal;
}

export function hoursUntilBookingStart(date: string, time: string): number {
  const clock = time.trim().slice(0, 5);
  const start = new Date(`${date}T${clock}:00`);
  if (Number.isNaN(start.getTime())) return Number.NEGATIVE_INFINITY;
  return (start.getTime() - Date.now()) / (1000 * 60 * 60);
}
