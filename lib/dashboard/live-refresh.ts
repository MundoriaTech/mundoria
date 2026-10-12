/** Quiet refetch while a list stays open. Live events arrive sooner. */
export const DASHBOARD_REFRESH_MS = 45_000;
/** Ops boards change faster, so they refetch a little sooner. */
export const OPS_REFRESH_MS = 30_000;

export type LiveWatch = {
  table: string;
  filter?: string;
};

export function bookingWatchesFor(role: "customer" | "cleaner"): LiveWatch[] {
  // No column filter. Row access stays with the select policies, and a filter
  // on customer_id or cleaner_id would miss status updates.
  if (role === "customer") {
    return [{ table: "bookings" }];
  }
  return [
    { table: "bookings" },
    { table: "cleaner_job_responses" },
    { table: "booking_team_members" },
  ];
}
