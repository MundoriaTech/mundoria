/**
 * First-party CRM / GTM event bus.
 * Pushes SEO-sheet event names onto window.dataLayer for GTM to forward.
 * Never include passwords, auth tokens, or payment instrument details.
 */

export const CRM_EVENTS = [
  "booking_cta_click",
  "checkout_view",
  "booking_completed",
  "login_success",
  "logout",
  "dashboard_view",
  "book_session_click",
  "view_sessions_click",
  "messages_view",
  "message_sent",
  "account_view",
  "account_updated",
  "booking_request_view",
  "recommendation_click",
] as const;

export type CrmEventName = (typeof CRM_EVENTS)[number];

export type CrmEventPayload = {
  action?: string | null;
  booking_amount?: number | null;
  booking_currency?: string | null;
  booking_datetime?: string | null;
  booking_id?: string | null;
  customer_id?: string | null;
  item?: string | null;
  page_url?: string | null;
  service?: string | null;
  service_location?: string | null;
  session_id?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_source?: string | null;
  [key: string]: unknown;
};

const SESSION_KEY = "mundoria_crm_session_id";
const DEDUP_PREFIX = "mundoria_crm_dedup:";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function ensureDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

function readUtm(): Pick<
  CrmEventPayload,
  "utm_campaign" | "utm_medium" | "utm_source"
> {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_campaign: params.get("utm_campaign"),
      utm_medium: params.get("utm_medium"),
      utm_source: params.get("utm_source"),
    };
  } catch {
    return {};
  }
}

/** Stable anonymous session id for the browser tab session. */
export function getCrmSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return null;
  }
}

function dedupKey(eventName: CrmEventName, payload: CrmEventPayload): string {
  if (eventName === "booking_completed" && payload.booking_id) {
    return `${DEDUP_PREFIX}booking_completed:${payload.booking_id}`;
  }
  if (
    eventName === "dashboard_view" ||
    eventName === "messages_view" ||
    eventName === "account_view" ||
    eventName === "checkout_view" ||
    eventName === "view_sessions_click"
  ) {
    return `${DEDUP_PREFIX}${eventName}:${payload.page_url ?? ""}`;
  }
  return "";
}

function alreadyFired(key: string): boolean {
  if (!key || typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markFired(key: string) {
  if (!key || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Ignore quota / private mode.
  }
}

/**
 * Push a CRM event to the dataLayer once per dedup key (views / booking_completed).
 * Click events are not session-deduped so repeat CTAs still count.
 */
export function trackCrmEvent(
  eventName: CrmEventName,
  payload: CrmEventPayload = {},
) {
  if (typeof window === "undefined") return;

  const page_url =
    payload.page_url ??
    `${window.location.pathname}${window.location.search}`;
  const enriched: CrmEventPayload = {
    ...readUtm(),
    ...payload,
    page_url,
    session_id: payload.session_id ?? getCrmSessionId(),
  };

  const key = dedupKey(eventName, enriched);
  if (key && alreadyFired(key)) return;

  ensureDataLayer();
  const event_id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `e_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.dataLayer?.push({
    event: eventName,
    event_id,
    timestamp: new Date().toISOString(),
    ...enriched,
  });

  if (key) markFired(key);
}
