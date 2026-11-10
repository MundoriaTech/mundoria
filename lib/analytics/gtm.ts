import type { ConsentPreferences } from "@/lib/analytics/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Container installed for the SEO account. Do not let an older env value replace it. */
const GTM_ID = "GTM-WB99DT5R";

export function getGtmId() {
  return GTM_ID;
}

export function getGaMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

export function analyticsConfigured() {
  return Boolean(getGtmId() || getGaMeasurementId());
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // Google expects the Arguments object, not a rest array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
}

/** Google Consent Mode defaults, call before any tags load. */
export function applyDefaultConsent() {
  if (typeof window === "undefined") return;
  ensureDataLayer();
  window.gtag?.("consent", "default", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

export function updateConsentMode(preferences: ConsentPreferences) {
  if (typeof window === "undefined") return;
  ensureDataLayer();
  window.gtag?.("consent", "update", {
    ad_personalization: preferences.marketing ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    analytics_storage: preferences.analytics ? "granted" : "denied",
    personalization_storage: preferences.preferences ? "granted" : "denied",
  });
}

function injectScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.async = true;
  script.id = id;
  script.src = src;
  document.head.appendChild(script);
}

export function loadGoogleTagManager() {
  const gtmId = getGtmId();
  if (!gtmId || typeof window === "undefined") return false;
  if (document.getElementById("mundoria-gtm")) return true;

  ensureDataLayer();
  window.dataLayer?.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  injectScript(
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
    "mundoria-gtm",
  );
  return true;
}

/** Fallback when GTM is not configured but GA4 measurement ID is. */
export function loadGa4Direct() {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === "undefined") return false;
  if (document.getElementById("mundoria-ga4")) return true;

  ensureDataLayer();
  injectScript(
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
    "mundoria-ga4",
  );
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, { anonymize_ip: true });
  return true;
}

/** Whether the visitor has allowed any optional tags (analytics or marketing). */
export function allowsOptionalTags(preferences: ConsentPreferences) {
  return preferences.analytics || preferences.marketing;
}

/**
 * Load the tag container only after an optional-cookie choice.
 * GTM is no longer bootstrapped in the document head: a container tag that
 * ignores Consent Mode (for example an ads pixel) could otherwise fire before
 * the visitor answers the banner, which UK PECR does not allow. Deferring the
 * container also takes it off the critical path for first page load.
 */
export function loadAnalyticsTags(preferences: ConsentPreferences) {
  if (!allowsOptionalTags(preferences)) return;
  if (getGtmId()) {
    loadGoogleTagManager();
    return;
  }
  if (preferences.analytics) loadGa4Direct();
}
