/** A visit that has started but isn't wrapped up: on the way, cleaning, or awaiting the customer. */
export const ONGOING_STATUSES = [
  "cleaner_en_route",
  "in_progress",
  "awaiting_customer_confirmation",
  "disputed",
];
