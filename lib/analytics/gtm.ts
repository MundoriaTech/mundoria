import type { ConsentPreferences } from "@/lib/analytics/consent";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded?: boolean;
  version?: string;
  push: (...args: unknown[]) => void;
};

type ClarityFn = ((...args: unknown[]) => void) & {
  q?: unknown[];
};

declare global {
  interface Window {
    clarity?: ClarityFn;
    dataLayer?: unknown[];
    fbq?: FbqFn;
    _fbq?: FbqFn;
    gtag?: (...args: unknown[]) => void;
  }
}

/** Container installed for the SEO account. Do not let an older env value replace it. */
const GTM_ID = "GTM-WB99DT5R";
/** Microsoft Clarity project id (session recordings / heatmaps). */
const CLARITY_ID = "zbn9ebygji";
/** Meta (Facebook) Pixel id for ads measurement. */
const META_PIXEL_ID = "1163478959669457";

export function getGtmId() {
  return GTM_ID;
}

export function getClarityId() {
  return process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || CLARITY_ID;
}

export function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || META_PIXEL_ID;
}

export function getGaMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

export function analyticsConfigured() {
  return Boolean(
    getGtmId() ||
      getGaMeasurementId() ||
      getClarityId() ||
      getMetaPixelId(),
  );
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

/** Microsoft Clarity — session recordings. Statistics consent only. */
export function loadMicrosoftClarity() {
  const clarityId = getClarityId();
  if (!clarityId || typeof window === "undefined") return false;
  if (document.getElementById("mundoria-clarity")) return true;

  const stub: ClarityFn = (...args: unknown[]) => {
    stub.q = stub.q || [];
    stub.q.push(args);
  };
  window.clarity = window.clarity || stub;

  injectScript(
    `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`,
    "mundoria-clarity",
  );
  return true;
}

/** Meta Pixel base code. Marketing consent only. Fires PageView on first load. */
export function loadMetaPixel() {
  const pixelId = getMetaPixelId();
  if (!pixelId || typeof window === "undefined") return false;
  if (document.getElementById("mundoria-meta-pixel")) return true;

  const n: FbqFn = Object.assign(
    (...args: unknown[]) => {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    },
    {
      queue: [] as unknown[],
      loaded: true,
      version: "2.0",
      push(...args: unknown[]) {
        n(...args);
      },
    },
  );
  if (!window.fbq) window.fbq = n;
  if (!window._fbq) window._fbq = window.fbq;

  injectScript(
    "https://connect.facebook.net/en_US/fbevents.js",
    "mundoria-meta-pixel",
  );
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
  return true;
}

/** SPA route changes after the base pixel is already loaded. */
export function trackMetaPageView() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("mundoria-meta-pixel")) return;
  window.fbq?.("track", "PageView");
}

function metaPixelReady() {
  return (
    typeof window !== "undefined" &&
    Boolean(document.getElementById("mundoria-meta-pixel")) &&
    typeof window.fbq === "function"
  );
}

/** Standard Meta Pixel event (no-op until marketing consent loaded the pixel). */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
) {
  if (!metaPixelReady()) return;
  if (params) window.fbq?.("track", event, params);
  else window.fbq?.("track", event);
}

/** Booking funnel started (`/booking/new`). */
export function trackMetaInitiateCheckout(params?: {
  content_category?: string | null;
  content_name?: string | null;
  currency?: string;
  value?: number;
}) {
  trackMetaEvent("InitiateCheckout", {
    content_category: params?.content_category || undefined,
    content_name: params?.content_name || undefined,
    currency: params?.currency ?? "GBP",
    ...(typeof params?.value === "number" ? { value: params.value } : {}),
  });
}

/** Customer reached payment / card-save step. */
export function trackMetaAddPaymentInfo(params?: {
  currency?: string;
  value?: number;
}) {
  trackMetaEvent("AddPaymentInfo", {
    currency: params?.currency ?? "GBP",
    ...(typeof params?.value === "number" ? { value: params.value } : {}),
  });
}

/** Booking created successfully after card setup. */
export function trackMetaPurchase(params: {
  bookingId: string;
  currency?: string;
  valuePence: number;
}) {
  const value = Math.max(0, params.valuePence) / 100;
  trackMetaEvent("Purchase", {
    content_ids: [params.bookingId],
    content_type: "product",
    currency: params.currency ?? "GBP",
    value,
  });
}

/**
 * Load the tag container only after an optional-cookie choice.
 * GTM is no longer bootstrapped in the document head: a container tag that
 * ignores Consent Mode (for example an ads pixel) could otherwise fire before
 * the visitor answers the banner, which UK PECR does not allow. Deferring the
 * container also takes it off the critical path for first page load.
 *
 * Clarity waits for Statistics consent; Meta Pixel waits for Marketing consent.
 */
export function loadAnalyticsTags(preferences: ConsentPreferences) {
  if (!allowsOptionalTags(preferences)) return;
  if (getGtmId()) {
    loadGoogleTagManager();
  } else if (preferences.analytics) {
    loadGa4Direct();
  }
  if (preferences.analytics) loadMicrosoftClarity();
  if (preferences.marketing) loadMetaPixel();
}
