"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createConsentPreferences,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from "@/lib/analytics/consent";
import {
  analyticsConfigured,
  applyDefaultConsent,
  loadAnalyticsTags,
  updateConsentMode,
} from "@/lib/analytics/gtm";

/**
 * WeCasa-style consent:
 * 1) Banner — Accept all / Reject optional / Cookie preferences
 * 2) Preferences — Necessary (locked) + optional toggles
 * Re-open via footer “Manage cookies” (no floating widget).
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(
    null,
  );

  useEffect(() => {
    applyDefaultConsent();
    const existing = readConsent();
    setPreferences(existing);
    // First visit (or reopen from footer) — show even before tags are configured
    // so consent UX matches WeCasa; tags only load when analytics is allowed.
    setBannerOpen(!existing);
    setReady(true);

    if (existing) {
      updateConsentMode(existing);
      if (existing.analytics && analyticsConfigured()) {
        loadAnalyticsTags(existing);
      }
    }

    function onOpenSettings() {
      setBannerOpen(true);
    }
    function onConsentUpdated(event: Event) {
      const detail = (event as CustomEvent<ConsentPreferences>).detail;
      setPreferences(detail);
    }

    window.addEventListener("cleanscape:open-cookie-settings", onOpenSettings);
    window.addEventListener("cleanscape:consent-updated", onConsentUpdated);
    return () => {
      window.removeEventListener(
        "cleanscape:open-cookie-settings",
        onOpenSettings,
      );
      window.removeEventListener(
        "cleanscape:consent-updated",
        onConsentUpdated,
      );
    };
  }, []);

  const save = useCallback((next: ConsentPreferences) => {
    writeConsent(next);
    setPreferences(next);
    updateConsentMode(next);
    if (next.analytics && analyticsConfigured()) {
      loadAnalyticsTags(next);
    }
    setBannerOpen(false);
  }, []);

  return (
    <>
      {children}
      {ready && bannerOpen ? (
        <CookieConsentBanner
          current={preferences}
          onAcceptAll={() =>
            save(
              createConsentPreferences({
                preferences: true,
                analytics: true,
                marketing: true,
              }),
            )
          }
          onRejectOptional={() =>
            save(
              createConsentPreferences({
                preferences: false,
                analytics: false,
                marketing: false,
              }),
            )
          }
          onSaveSelection={(prefs) => save(createConsentPreferences(prefs))}
        />
      ) : null}
    </>
  );
}

function CookieConsentBanner({
  current,
  onAcceptAll,
  onRejectOptional,
  onSaveSelection,
}: {
  current: ConsentPreferences | null;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onSaveSelection: (
    prefs: Pick<ConsentPreferences, "preferences" | "analytics" | "marketing">,
  ) => void;
}) {
  // Returning visitors who open “Manage cookies” go straight to preferences.
  const [layer, setLayer] = useState<"banner" | "preferences">(
    current ? "preferences" : "banner",
  );
  const [prefsEnabled, setPrefsEnabled] = useState(
    current?.preferences ?? false,
  );
  const [statistics, setStatistics] = useState(current?.analytics ?? false);
  const [marketing, setMarketing] = useState(current?.marketing ?? false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      aria-describedby="cleanscape-cookie-copy"
      aria-labelledby="cleanscape-cookie-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-end sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] md:items-center"
      role="dialog"
    >
      <div className="flex max-h-[min(92dvh,40rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.25rem] border border-border bg-card shadow-2xl shadow-foreground/10 sm:rounded-[1.25rem]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-6 sm:pt-6">
          {layer === "banner" ? (
            <>
              <h2
                className="text-lg font-black tracking-[-0.03em] text-foreground"
                id="cleanscape-cookie-title"
              >
                This website uses cookies
              </h2>
              <div
                className="mt-2 space-y-3 text-sm font-medium leading-6 text-muted-foreground"
                id="cleanscape-cookie-copy"
              >
                <p>
                  CleanScape and our selected partners use cookies and similar
                  technologies that are necessary to present this website and to
                  give you the best experience. If you consent, we will also use
                  cookies for statistics and marketing.
                </p>
                <p>
                  Read our{" "}
                  <Link
                    className="font-bold text-primary underline-offset-2 hover:underline"
                    href="/cookies"
                  >
                    cookie management policy
                  </Link>{" "}
                  to learn more about the cookies we use.
                </p>
                <p>
                  You can withdraw or change your consent at any time by
                  clicking <span className="font-semibold text-foreground">Manage cookies</span>{" "}
                  at the bottom of each page.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2
                className="text-lg font-black tracking-[-0.03em] text-foreground"
                id="cleanscape-cookie-title"
              >
                Select the cookies you accept
              </h2>
              <div
                className="mt-2 space-y-3 text-sm font-medium leading-6 text-muted-foreground"
                id="cleanscape-cookie-copy"
              >
                <p>
                  On this site we always use cookies that are essential for the
                  site to work. If you consent, we will also use other types of
                  cookies. You can give or withdraw consent below, and change it
                  anytime via <span className="font-semibold text-foreground">Manage cookies</span>{" "}
                  in the footer.
                </p>
                <p>
                  Learn more in our{" "}
                  <Link
                    className="font-bold text-primary underline-offset-2 hover:underline"
                    href="/cookies"
                  >
                    cookie management policy
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <label className="flex items-start gap-3">
                  <input
                    checked
                    className="mt-1"
                    disabled
                    readOnly
                    type="checkbox"
                  />
                  <span>
                    <span className="font-bold text-foreground">Necessary</span>
                    <span className="mt-1 block text-muted-foreground">
                      Essential for the site to work (security, login, booking).
                      Always on.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    checked={prefsEnabled}
                    className="mt-1"
                    onChange={(event) => setPrefsEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-bold text-foreground">Preferences</span>
                    <span className="mt-1 block text-muted-foreground">
                      Remember choices that change how the site looks or behaves
                      (for example theme).
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    checked={statistics}
                    className="mt-1"
                    onChange={(event) => setStatistics(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-bold text-foreground">Statistics</span>
                    <span className="mt-1 block text-muted-foreground">
                      Help us understand how visitors use the site (analytics).
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    checked={marketing}
                    className="mt-1"
                    onChange={(event) => setMarketing(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-bold text-foreground">Marketing</span>
                    <span className="mt-1 block text-muted-foreground">
                      Used to show more relevant ads and measure campaigns.
                    </span>
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
          {layer === "banner" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                className="h-11 w-full rounded-full bg-foreground px-5 font-black text-background hover:bg-foreground/90 sm:w-auto"
                onClick={onAcceptAll}
                type="button"
              >
                Accept all cookies
              </Button>
              <Button
                className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
                onClick={onRejectOptional}
                type="button"
                variant="outline"
              >
                Reject optional cookies
              </Button>
              <Button
                className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
                onClick={() => setLayer("preferences")}
                type="button"
                variant="ghost"
              >
                Cookie preferences
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                className="h-11 w-full rounded-full bg-foreground px-5 font-black text-background hover:bg-foreground/90 sm:w-auto"
                onClick={() =>
                  onSaveSelection({
                    preferences: prefsEnabled,
                    analytics: statistics,
                    marketing,
                  })
                }
                type="button"
              >
                Accept these cookies
              </Button>
              <Button
                className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
                onClick={onRejectOptional}
                type="button"
                variant="outline"
              >
                Reject optional cookies
              </Button>
              {!current ? (
                <Button
                  className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
                  onClick={() => setLayer("banner")}
                  type="button"
                  variant="ghost"
                >
                  Back
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
