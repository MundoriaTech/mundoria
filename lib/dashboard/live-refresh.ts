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

/** Admin shell: any of these changing should refresh the open ops page. */
export function adminOpsWatches(): LiveWatch[] {
  return [
    { table: "bookings" },
    { table: "booking_add_ons" },
    { table: "booking_status_history" },
    { table: "matching_decisions" },
    { table: "cleaner_job_responses" },
    { table: "booking_team_members" },
    { table: "callback_leads" },
    { table: "leads" },
    { table: "booking_drafts" },
    { table: "disputes" },
    { table: "messages" },
    { table: "support_conversations" },
    { table: "support_messages" },
    { table: "cleaner_profiles" },
    { table: "profiles" },
  ];
}
