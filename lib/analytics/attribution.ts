import { readConsent } from "@/lib/analytics/consent";

/**
 * First-touch marketing attribution, kept in the visitor's browser so a
 * person who lands from an ad and signs up or asks for a callback pages later
 * still carries the ad's UTMs. Stored only after the visitor allows analytics
 * or marketing cookies; without that, only the current page's URL is used.
 * Client-only; every storage access is guarded.
 */

export type Attribution = {
  fbclid?: string;
  gclid?: string;
  landing_path?: string;
  referrer?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_medium?: string;
  utm_source?: string;
  utm_term?: string;
  captured_at?: string;
};

const KEY = "mundoria-attribution";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

function fromUrl(): Attribution {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Attribution = {};
  for (const key of PARAMS) {
    const value = params.get(key)?.trim();
    if (value) out[key] = value.slice(0, 200);
  }
  return out;
}

function read(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (parsed.captured_at && Date.now() - Date.parse(parsed.captured_at) > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Call on every page view: stores the first visit that carried ad parameters (or an outside referrer). */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const consent = readConsent();
  if (!consent?.analytics && !consent?.marketing) return;
  const current = fromUrl();
  const existing = read();
  const hasAdParams = Object.keys(current).length > 0;
  if (existing && !hasAdParams) return;
  if (existing && hasAdParams && existing.utm_source) return; // keep the first ad touch
  let referrer: string | undefined;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrer = ref.origin + ref.pathname;
  } catch {
    referrer = undefined;
  }
  if (!hasAdParams && !referrer) return;
  const value: Attribution = {
    ...current,
    captured_at: new Date().toISOString(),
    landing_path: window.location.pathname.slice(0, 200),
    ...(referrer ? { referrer: referrer.slice(0, 300) } : {}),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the URL still works on this page.
  }
}

/** The ad parameters on this page, else the stored first touch. */
export function getAttribution(): Attribution {
  const current = fromUrl();
  if (current.utm_source || current.gclid || current.fbclid) return current;
  return read() ?? {};
}
