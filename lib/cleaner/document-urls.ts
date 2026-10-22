/** Parse stored cleaner document field (legacy single path or JSON array). */
export function parseDocumentUrls(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        // Keep empty slots so front/back (or page 1/2) positions stay stable.
        return parsed.map((item) => String(item ?? "").trim());
      }
    } catch {
      /* fall through */
    }
  }
  return [trimmed];
}

export function serializeDocumentUrls(urls: Array<string | null | undefined>) {
  const slots = urls.map((item) => String(item ?? "").trim());
  if (slots.every((item) => !item)) return "";
  if (slots.length === 1) return slots[0];
  // Always persist both slots as JSON so removing one side does not shift the other.
  return JSON.stringify([slots[0] ?? "", slots[1] ?? ""]);
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

export function hasBothDocumentSides(stored: string | null | undefined) {
  const urls = parseDocumentUrls(stored);
  return Boolean(urls[0]) && Boolean(urls[1]);
}
