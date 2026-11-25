export const CALLBACK_CALL_STATUSES = ["to_call", "no_answer", "spoke"] as const;
export const CALLBACK_OUTCOMES = [
  "pending_booking",
  "future_booking",
  "customer",
  "out_of_area",
  "closed",
] as const;
export const CALLBACK_AREAS = ["unknown", "in_area", "out_of_area"] as const;

export type CallbackCallStatus = (typeof CALLBACK_CALL_STATUSES)[number];
export type CallbackOutcome = (typeof CALLBACK_OUTCOMES)[number];
export type CallbackArea = (typeof CALLBACK_AREAS)[number];
export type CallbackDeskFilter =
  | "to_call"
  | "no_answer"
  | "pending_booking"
  | "future_booking"
  | "customer"
  | "out_of_area"
  | "closed"
  | "all";

export const CALLBACK_CALL_LABELS: Record<CallbackCallStatus, string> = {
  to_call: "To call",
  no_answer: "No answer",
  spoke: "Spoke",
};

export const CALLBACK_OUTCOME_LABELS: Record<CallbackOutcome, string> = {
  pending_booking: "Pending booking",
  future_booking: "Future booking",
  customer: "Customer",
  out_of_area: "Out of area",
  closed: "Closed",
};

export const CALLBACK_AREA_LABELS: Record<CallbackArea, string> = {
  unknown: "Unknown",
  in_area: "In area",
  out_of_area: "Out of area",
};

export const CALLBACK_FILTERS: { id: CallbackDeskFilter; label: string }[] = [
  { id: "to_call", label: "To call" },
  { id: "no_answer", label: "No answer" },
  { id: "pending_booking", label: "Pending" },
  { id: "future_booking", label: "Future" },
  { id: "customer", label: "Customer" },
  { id: "out_of_area", label: "Out of area" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

export type CallbackLeadRow = {
  area: CallbackArea;
  available_in_10_min: boolean;
  call_status: CallbackCallStatus;
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  notes: string | null;
  notes_updated_at: string | null;
  notes_updated_by_name: string | null;
  outcome: CallbackOutcome | null;
  phone: string;
  source: string;
  town: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_source: string | null;
};

export function mapCallbackLeadRow(row: Record<string, unknown>): CallbackLeadRow {
  return {
    area: parseArea(row.area),
    available_in_10_min: Boolean(row.available_in_10_min),
    call_status: parseCallStatus(row.call_status),
    created_at: row.created_at as string,
    email: row.email as string,
    first_name: row.first_name as string,
    id: row.id as string,
    last_name: row.last_name as string,
    notes: (row.notes as string | null) ?? null,
    notes_updated_at: (row.notes_updated_at as string | null) ?? null,
    notes_updated_by_name: (() => {
      const editor = Array.isArray(row.notes_editor)
        ? row.notes_editor[0]
        : row.notes_editor;
      return (editor as { full_name?: string | null } | null)?.full_name ?? null;
    })(),
    outcome: parseOutcome(row.outcome),
    phone: row.phone as string,
    source: row.source as string,
    town: (row.town as string | null) ?? null,
    utm_campaign: (row.utm_campaign as string | null) ?? null,
    utm_medium: (row.utm_medium as string | null) ?? null,
    utm_source: (row.utm_source as string | null) ?? null,
  };
}

export function parseCallStatus(value: unknown): CallbackCallStatus {
  return CALLBACK_CALL_STATUSES.includes(value as CallbackCallStatus)
    ? (value as CallbackCallStatus)
    : "to_call";
}

export function parseOutcome(value: unknown): CallbackOutcome | null {
  return CALLBACK_OUTCOMES.includes(value as CallbackOutcome)
    ? (value as CallbackOutcome)
    : null;
}

export function parseArea(value: unknown): CallbackArea {
  return CALLBACK_AREAS.includes(value as CallbackArea)
    ? (value as CallbackArea)
    : "unknown";
}

export function filterCallbackLeads(
  rows: CallbackLeadRow[],
  filter: CallbackDeskFilter,
) {
  if (filter === "all") return rows;
  if (filter === "to_call" || filter === "no_answer") {
    return rows.filter((row) => row.call_status === filter && !row.outcome);
  }
  if (filter === "out_of_area") {
    return rows.filter(
      (row) => row.area === "out_of_area" || row.outcome === "out_of_area",
    );
  }
  return rows.filter((row) => row.outcome === filter);
}

/** The popup has no name field; the form stores "Guest Lead" as a stand-in. */
export function callbackDisplayName(row: { first_name: string; last_name: string }) {
  const first = row.first_name.trim();
  const last = row.last_name.trim();
  if (first.toLowerCase() === "guest" && last.toLowerCase() === "lead") return "No name given";
  return last.toLowerCase() === "lead" ? first : `${first} ${last}`.trim();
}

