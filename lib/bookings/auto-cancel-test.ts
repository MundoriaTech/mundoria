/**
 * TEMPORARY test exception (26 Nov 2026): bookings by this customer (bosoye,
 * testing with cleaner Maritha Miracle) are never cancelled automatically,
 * as if an admin had protected them. Remove once the test is done.
 */
const AUTO_CANCEL_TEST_CUSTOMER_IDS = new Set<string>([
  "5af11b68-8ae3-4a5f-ab2f-2bc476e5a4ae", // bosoye
]);

/** True when automatic cancellation must not touch this booking. */
export function isAutoCancelProtected(booking: {
  auto_cancel_exempt?: boolean | null;
  customer_id?: string | null;
}) {
  return (
    Boolean(booking.auto_cancel_exempt) ||
    Boolean(booking.customer_id && AUTO_CANCEL_TEST_CUSTOMER_IDS.has(booking.customer_id))
  );
}
