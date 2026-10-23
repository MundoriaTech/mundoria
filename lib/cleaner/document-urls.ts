/** Parse stored cleaner document field (legacy single path or JSON array). */
export function parseDocumentUrls(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        // Keep empty slots so front/back (or page) positions stay stable when needed.
        return parsed.map((item) => String(item ?? "").trim());
      }
    } catch {
      /* fall through */
    }
  }
  return [trimmed];
}

/** Compact non-empty paths only (variable-length lists such as DBS pages). */
export function parseDocumentList(value: string | null | undefined): string[] {
  return parseDocumentUrls(value).filter(Boolean);
}

export function serializeDocumentUrls(urls: Array<string | null | undefined>) {
  const slots = urls.map((item) => String(item ?? "").trim());
  if (slots.every((item) => !item)) return "";
  if (slots.length === 1) return slots[0];
  // Always persist both slots as JSON so removing one side does not shift the other.
  return JSON.stringify([slots[0] ?? "", slots[1] ?? ""]);
}

export function serializeDocumentList(urls: Array<string | null | undefined>) {
  const slots = urls.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (slots.length === 0) return "";
  if (slots.length === 1) return slots[0];
  return JSON.stringify(slots);
}

export function documentSideValue(
  stored: string | null | undefined,
  side: 0 | 1,
) {
  return parseDocumentUrls(stored)[side] ?? "";
}

export function withDocumentSide(
  stored: string | null | undefined,
  side: 0 | 1,
  next: string,
) {
  const urls = parseDocumentUrls(stored);
  const slots: [string, string] = [urls[0] ?? "", urls[1] ?? ""];
  slots[side] = next.trim();
  return serializeDocumentUrls(slots);
}

/** Replace or append at index in a compact variable-length document list. */
export function withDocumentAt(
  stored: string | null | undefined,
  index: number,
  next: string,
) {
  const urls = parseDocumentList(stored);
  const value = next.trim();
  if (!value) return removeDocumentAt(stored, index);
  // Only replace an existing page or append as the next page — never skip ahead.
  if (index < 0 || index > urls.length) return serializeDocumentList(urls);
  if (index === urls.length) {
    urls.push(value);
  } else {
    urls[index] = value;
  }
  return serializeDocumentList(urls);
}

export function removeDocumentAt(
  stored: string | null | undefined,
  index: number,
) {
  const urls = parseDocumentList(stored);
  if (index < 0 || index >= urls.length) return serializeDocumentList(urls);
  urls.splice(index, 1);
  return serializeDocumentList(urls);
}

export function hasBothDocumentSides(stored: string | null | undefined) {
  const urls = parseDocumentUrls(stored);
  return Boolean(urls[0]) && Boolean(urls[1]);
}

export function hasAnyDocument(stored: string | null | undefined) {
  return parseDocumentList(stored).length > 0;
}

export const MAX_DBS_DOCUMENT_PAGES = 6;
