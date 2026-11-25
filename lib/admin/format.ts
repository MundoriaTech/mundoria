/**
 * Formatting for admin detail pages. Server components render on Vercel in
 * UTC, so every date/time is pinned to UK time here instead of relying on
 * toLocaleString's default zone.
 */

const UK_ZONE = "Europe/London";

function parse(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  // A bare YYYY-MM-DD is a calendar date, not midnight UTC.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!, 12));
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "25 Nov 2026, 16:04" in UK time, or "—". */
export function ukDateTime(value: string | number | Date | null | undefined) {
  const date = parse(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: UK_ZONE,
    year: "numeric",
  }).format(date);
}

/** "Fri 27 Nov 2026" in UK time, or "—". */
export function ukDate(value: string | number | Date | null | undefined, withWeekday = false) {
  const date = parse(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: UK_ZONE,
    year: "numeric",
    ...(withWeekday ? { weekday: "short" as const } : {}),
  }).format(date);
}

/** "snake_case_value" -> "Snake case value". */
export function humanize(value: string | null | undefined) {
  if (!value) return "—";
  const text = value.replaceAll("_", " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function yesNo(value: boolean | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "Not answered";
  if (typeof value === "string") return value === "yes" ? "Yes" : value === "no" ? "No" : humanize(value);
  return value ? "Yes" : "No";
}

/** "1m" -> "£1 million", "1500000" -> "£1,500,000". */
export function coverAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const text = String(value).trim().toLowerCase();
  const millions = text.match(/^(\d+(?:\.\d+)?)m$/);
  if (millions) return `£${millions[1]} million`;
  const pounds = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(pounds) && pounds > 0 ? `£${pounds.toLocaleString("en-GB")}` : String(value);
}

/** Pence -> "£52.50". */
export function poundsFromPence(pence: number | null | undefined) {
  if (pence === null || pence === undefined) return "—";
  return `£${(pence / 100).toFixed(2)}`;
}
