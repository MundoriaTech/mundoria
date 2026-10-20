/** Browser-safe safety-alert helpers (no Twilio / admin clients). */

export const SAFETY_ALERT_REASONS = [
  "unsafe_behaviour",
  "unwell_or_accident",
  "access_or_property",
  "other",
] as const;

export type SafetyAlertReason = (typeof SAFETY_ALERT_REASONS)[number];

export type SafetyAlertStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "withdrawn";

export const SAFETY_REASON_LABELS: Record<SafetyAlertReason, string> = {
  unsafe_behaviour: "Unsafe or threatening behaviour",
  unwell_or_accident: "Feeling unwell or accident",
  access_or_property: "Access or property concern",
  other: "Something else",
};

export function safetyAlertAllowed(status: string, scheduledDate: string) {
  if (status === "cleaner_en_route" || status === "in_progress") return true;
  if (status !== "confirmed") return false;
  const today = new Date().toISOString().slice(0, 10);
  return scheduledDate <= today;
}

export function formatAddressLine(address: {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  postcode?: string | null;
} | null) {
  if (!address) return null;
  return [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.postcode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
