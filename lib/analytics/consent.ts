export const CONSENT_STORAGE_KEY = "cleanscape-cookie-consent-v1";

export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp when the user last chose. */
  updatedAt: string;
  version: 1;
};

export type ConsentDecision = ConsentPreferences | null;

export function createConsentPreferences(
  partial: Pick<ConsentPreferences, "analytics" | "marketing">,
): ConsentPreferences {
  return {
    analytics: partial.analytics,
    marketing: partial.marketing,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

export function readConsent(): ConsentDecision {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (parsed.version !== 1) return null;
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
      version: 1,
    };
  } catch {
    return null;
  }
}

export function writeConsent(preferences: ConsentPreferences) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent("cleanscape:consent-updated", { detail: preferences }),
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("cleanscape:open-cookie-settings"));
}
