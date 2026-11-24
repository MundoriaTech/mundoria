import { zohoFetch, zohoOrigin } from "@/lib/zoho/http";
import type { CalendarEvent } from "@/lib/zoho/calendar-event";

export class CalendarFailure extends Error {
  constructor(public code: string, public retrySafe = false) { super(code); }
}

export function calendarConfig() {
  if (process.env.ZOHO_CALENDAR_ENABLED !== "true") return null;
  const clientId = process.env.ZOHO_CALENDAR_CLIENT_ID?.trim();
  const secret = process.env.ZOHO_CALENDAR_CLIENT_SECRET?.trim();
  const refresh = process.env.ZOHO_CALENDAR_REFRESH_TOKEN?.trim();
  const uid = process.env.ZOHO_CALENDAR_UID?.trim();
  const host = process.env.ZOHO_CALENDAR_HOST_EMAIL?.trim();
  const instructions = process.env.ZOHO_CALENDAR_CALL_INSTRUCTIONS?.trim();
  if (!clientId || !secret || !refresh || !uid || !host || !instructions ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(host) || instructions.length > 1000) {
    throw new CalendarFailure("CALENDAR_CONFIGURATION_MISSING");
  }
  return { clientId, secret, refresh, uid, host, instructions,
    accounts: zohoOrigin(process.env.ZOHO_CALENDAR_ACCOUNTS_URL || "https://accounts.zoho.com", "accounts"),
    origin: zohoOrigin(process.env.ZOHO_CALENDAR_BASE_URL || "https://calendar.zoho.com", "calendar") };
}

export type CalendarConfig = NonNullable<ReturnType<typeof calendarConfig>>;

export async function calendarClient(config: CalendarConfig) {
  let response: Response;
  try {
    response = await zohoFetch(`${config.accounts}/oauth/v2/token`, {
      method: "POST",
      body: new URLSearchParams({ grant_type: "refresh_token", client_id: config.clientId,
        client_secret: config.secret, refresh_token: config.refresh }),
    });
  } catch { throw new CalendarFailure("CALENDAR_AUTH_UNAVAILABLE", true); }
  const token = await response.json().catch(() => null) as { access_token?: string } | null;
  if (!response.ok || !token?.access_token) throw new CalendarFailure("CALENDAR_AUTH_FAILED", true);
  const authorization = `Zoho-oauthtoken ${token.access_token}`;
  const base = `${config.origin}/api/v1/calendars/${encodeURIComponent(config.uid)}/events`;

  async function request(method: "GET" | "POST" | "PUT" | "DELETE", uid?: string, event?: CalendarEvent) {
    const url = new URL(uid ? `${base}/${encodeURIComponent(uid)}` : base);
    // Zoho documents eventdata as a query parameter. Never log URL/error bodies:
    // it includes the invitee address. Disable request URL capture in APM too.
    if (event) url.searchParams.set("eventdata", JSON.stringify(event));
    let result: Response;
    try {
      result = await zohoFetch(url.toString(), { method, headers: { Authorization: authorization,
        Accept: "application/json+large", ...(event?.etag != null ? { etag: String(event.etag) } : {}) } });
    } catch { throw new CalendarFailure("CALENDAR_OUTCOME_UNKNOWN", method === "GET"); }
    // No blind retry after a write: an invitation may have been issued even if
    // the response was lost or a proxy returned a 5xx.
    if (!result.ok) throw new CalendarFailure(`CALENDAR_HTTP_${result.status}`, method === "GET");
    const data = await result.json().catch(() => null) as { events?: CalendarEvent[] } | null;
    const saved = data?.events?.[0];
    if (!saved?.uid || (uid && saved.uid !== uid)) {
      throw new CalendarFailure("CALENDAR_RESPONSE_UNCONFIRMED", method === "GET");
    }
    if (method === "DELETE" && saved.estatus !== "deleted") {
      throw new CalendarFailure("CALENDAR_CANCELLATION_UNCONFIRMED");
    }
    return saved;
  }
  return {
    get: (uid: string) => request("GET", uid),
    create: (event: CalendarEvent) => request("POST", undefined, event),
    update: (uid: string, event: CalendarEvent) => request("PUT", uid, event),
    cancel: (event: CalendarEvent) => request("DELETE", event.uid,
      { uid: event.uid, etag: event.etag, notify_attendee: 2 }),
  };
}
