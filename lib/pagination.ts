export const PAGE_SIZES = {
  mag: 12,
  help: 10,
  admin: 25,
  app: 10,
} as const;

export function parsePage(
  raw: string | string[] | undefined | null,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function totalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0 || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, pages: number): number {
  if (pages < 1) return 1;
  return Math.min(Math.max(1, page), pages);
}

export function slicePage<T>(
  items: T[],
  page: number,
  pageSize: number,
): T[] {
  const pages = totalPages(items.length, pageSize);
  const safe = clampPage(page, pages);
  const start = (safe - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Compact page list: 1 … 4 5 6 … 20 */
export function pageWindow(
  current: number,
  pages: number,
  radius = 1,
): Array<number | "ellipsis"> {
  if (pages <= 1) return [1];
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  const set = new Set<number>();
  set.add(1);
  set.add(pages);
  for (let i = current - radius; i <= current + radius; i += 1) {
    if (i >= 1 && i <= pages) set.add(i);
  }

  const sorted = Array.from(set).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(n);
  }
  return out;
}

export function buildPageHref(
  pathname: string,
  params: Record<string, string | undefined | null>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (key === "page") continue;
    search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function rangeLabel(
  page: number,
  pageSize: number,
  totalItems: number,
): string {
  if (totalItems === 0) return "0 results";
  const pages = totalPages(totalItems, pageSize);
  const safe = clampPage(page, pages);
  const start = (safe - 1) * pageSize + 1;
  const end = Math.min(safe * pageSize, totalItems);
  return `${start}–${end} of ${totalItems}`;
}
