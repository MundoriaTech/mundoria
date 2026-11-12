import type { DocumentReviewStatus } from "@/types/cleaner";

export const CLEANER_DOCUMENT_KINDS = [
  "dbs",
  "id",
  "utr",
  "insurance",
  "headshot",
] as const;

export type CleanerDocumentKind = (typeof CLEANER_DOCUMENT_KINDS)[number];

export const CLEANER_DOCUMENT_LABELS: Record<CleanerDocumentKind, string> = {
  dbs: "DBS",
  headshot: "Headshot",
  id: "Government ID",
  insurance: "Insurance",
  utr: "UTR",
};

type DocumentReviewNote = {
  decision: "verified" | "rejected";
  note: string;
  reviewed_at: string;
  reviewed_by: string;
};

export type DocumentReviewsMap = Partial<
  Record<CleanerDocumentKind, DocumentReviewNote>
>;

export function isCleanerDocumentKind(
  value: string,
): value is CleanerDocumentKind {
  return (CLEANER_DOCUMENT_KINDS as readonly string[]).includes(value);
}

export function documentStatusColumn(
  kind: CleanerDocumentKind,
):
  | "dbs_document_status"
  | "id_document_status"
  | "utr_document_status"
  | "insurance_status"
  | "headshot_status" {
  switch (kind) {
    case "dbs":
      return "dbs_document_status";
    case "id":
      return "id_document_status";
    case "utr":
      return "utr_document_status";
    case "insurance":
      return "insurance_status";
    case "headshot":
      return "headshot_status";
  }
}

export function documentVerifiedColumn(
  kind: CleanerDocumentKind,
): "dbs_verified" | "id_verified" | "utr_verified" | null {
  switch (kind) {
    case "dbs":
      return "dbs_verified";
    case "id":
      return "id_verified";
    case "utr":
      return "utr_verified";
    default:
      return null;
  }
}

export function readDocumentReviews(
  flags: Record<string, unknown> | null | undefined,
): DocumentReviewsMap {
  const raw = flags?.document_reviews;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const next: DocumentReviewsMap = {};
  for (const kind of CLEANER_DOCUMENT_KINDS) {
    const entry = (raw as Record<string, unknown>)[kind];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const decision =
      record.decision === "verified" || record.decision === "rejected"
        ? record.decision
        : null;
    const note = typeof record.note === "string" ? record.note.trim() : "";
    const reviewed_at =
      typeof record.reviewed_at === "string" ? record.reviewed_at : "";
    const reviewed_by =
      typeof record.reviewed_by === "string" ? record.reviewed_by : "";
    if (!decision || !note || !reviewed_at) continue;
    next[kind] = { decision, note, reviewed_at, reviewed_by };
  }
  return next;
}

export function writeDocumentReview(
  flags: Record<string, unknown> | null | undefined,
  kind: CleanerDocumentKind,
  review: DocumentReviewNote,
) {
  const current = { ...(flags ?? {}) };
  const reviews = {
    ...readDocumentReviews(current),
    [kind]: review,
  };
  current.document_reviews = reviews;
  if (kind && review.decision === "rejected") {
    current.unreadable_doc = true;
    current.unreadable_doc_kind = kind;
    current.unreadable_doc_hint = review.note;
    current.unreadable_doc_flagged_at = review.reviewed_at;
  }
  return current;
}

export function documentReviewNoteFor(
  flags: Record<string, unknown> | null | undefined,
  kind: CleanerDocumentKind,
) {
  return readDocumentReviews(flags)[kind] ?? null;
}

export function cleanerFacingDocStatus(status: DocumentReviewStatus | string) {
  if (status === "verified") return "Approved";
  if (status === "pending") return "Being checked";
  if (status === "rejected") return "Needs another look";
  if (status === "missing") return "Not uploaded";
  if (status === "expired") return "Expired";
  return String(status).replaceAll("_", " ");
}
