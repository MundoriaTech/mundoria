/**
 * Lead automation settings. Every external service is optional: when its env
 * vars are missing the engine records a "skipped" step instead of failing, so
 * the whole system can run (and be tested) before any account is paid for.
 */

export const OUTREACH_TIME_ZONE = "Europe/London";

/** Master switch. Off = nothing is sent or called; leads are still recorded. */
export function outreachEnabled() {
  return process.env.OUTREACH_ENABLED === "true";
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.mundoria.co.uk"
  );
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.OUTREACH_SMS_FROM || process.env.TWILIO_PHONE_NUMBER),
  );
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function callsConfigured() {
  return Boolean(
    process.env.VAPI_API_KEY &&
      process.env.VAPI_ASSISTANT_ID &&
      process.env.VAPI_PHONE_NUMBER_ID,
  );
}

/** Claude model for replies and reports. Defaults to the current Opus. */
export function aiModel() {
  return process.env.OUTREACH_AI_MODEL?.trim() || "claude-opus-5-5";
}

/** "auto" (default): the AI sends routine answers itself. "review": every AI reply waits for a person. */
export function aiReplyMode(): "auto" | "review" {
  return process.env.OUTREACH_AI_REPLY_MODE === "review" ? "review" : "auto";
}

/** Marketing sender, ideally on its own subdomain, e.g. "Mundoria <hello@news.mundoria.co.uk>". */
export function outreachFrom() {
  return (
    process.env.OUTREACH_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Mundoria <hello@mundoria.co.uk>"
  );
}

/** Where customers' email replies go (a Resend inbound address so the AI sees them). */
export function outreachReplyTo() {
  return (
    process.env.OUTREACH_REPLY_TO?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "hello@mundoria.co.uk"
  );
}

export function smsFrom() {
  return process.env.OUTREACH_SMS_FROM?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim() || "";
}

/** On-call phone (E.164) that gets an instant text for every callback request. */
export function onCallPhone() {
  return toE164(process.env.OUTREACH_ONCALL_PHONE ?? "");
}

/** Messages and calls only go out between these UK hours (inclusive start, exclusive end). */
export const QUIET_HOURS = {
  start: Number(process.env.OUTREACH_SEND_FROM_HOUR ?? 8),
  end: Number(process.env.OUTREACH_SEND_UNTIL_HOUR ?? 20),
};

/** No lead gets more than this many automated messages + calls in 7 days. */
export const WEEKLY_TOUCH_LIMIT = Number(process.env.OUTREACH_WEEKLY_LIMIT ?? 6);

/** AI call attempts per lead, ever. */
export const MAX_CALL_ATTEMPTS = Number(process.env.OUTREACH_MAX_CALLS ?? 2);

export function ukHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: OUTREACH_TIME_ZONE,
    }).format(date),
  ) % 24;
}

export function ukWeekday(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: OUTREACH_TIME_ZONE,
    weekday: "short",
  }).format(date);
}

export function withinSendingHours(date = new Date()) {
  const hour = ukHour(date);
  return hour >= QUIET_HOURS.start && hour < QUIET_HOURS.end;
}

/** Next time sending is allowed (now, or the next 08:00-ish UK). */
export function nextSendingTime(date = new Date()) {
  if (withinSendingHours(date)) return date;
  const next = new Date(date);
  // Step forward in 15-minute increments until inside the window (at most ~12h).
  for (let i = 0; i < 96 && !withinSendingHours(next); i += 1) {
    next.setTime(next.getTime() + 15 * 60 * 1000);
  }
  return next;
}

/** "+44 7700 900123", "07700900123", "447700900123" → "+447700900123". Empty if unusable. */
export function toE164(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : "";
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  if (digits.startsWith("44")) return `+${digits}`;
  return /^\d{10}$/.test(digits) ? `+44${digits}` : "";
}

export function normalizeEmail(raw: string | null | undefined) {
  const email = raw?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
