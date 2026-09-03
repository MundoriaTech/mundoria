"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CookieSettingsWidget } from "@/components/analytics/cookie-settings-button";
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
    setBannerOpen(!existing && analyticsConfigured());
    setReady(true);

    if (existing?.analytics) {
      updateConsentMode(existing);
      loadAnalyticsTags(existing);
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
    if (next.analytics) {
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
            save(createConsentPreferences({ analytics: true, marketing: true }))
          }
          onReject={() =>
            save(
              createConsentPreferences({ analytics: false, marketing: false }),
            )
          }
          onSaveCustom={(analytics, marketing) =>
            save(createConsentPreferences({ analytics, marketing }))
          }
        />
      ) : null}
      {ready && preferences && !bannerOpen && analyticsConfigured() ? (
        <CookieSettingsWidget
          onClick={() => setBannerOpen(true)}
          variant="floating"
        />
      ) : null}
    </>
  );
}

function CookieConsentBanner({
  current,
  onAcceptAll,
  onReject,
  onSaveCustom,
}: {
  current: ConsentPreferences | null;
  onAcceptAll: () => void;
  onReject: () => void;
  onSaveCustom: (analytics: boolean, marketing: boolean) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(current?.analytics ?? true);
  const [marketing, setMarketing] = useState(current?.marketing ?? false);

  return (
    <div
      aria-describedby="cleanscape-cookie-copy"
      aria-labelledby="cleanscape-cookie-title"
      className="fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-6"
      role="dialog"
    >
      <div className="mx-auto max-w-3xl rounded-[1.25rem] border border-border bg-card p-5 shadow-2xl shadow-foreground/10 sm:p-6">
        <h2
          className="text-lg font-black tracking-[-0.03em] text-foreground"
          id="cleanscape-cookie-title"
        >
          Cookies on CleanScape
        </h2>
        <p
          className="mt-2 text-sm font-medium leading-6 text-muted-foreground"
          id="cleanscape-cookie-copy"
        >
          We use essential cookies to run the site. With your permission we also
          use analytics cookies (via Google Tag Manager/Analytics) to
          understand how CleanScape is used. You can change this anytime. See
          our{" "}
          <Link className="font-bold text-primary underline-offset-2 hover:underline" href="/privacy">
            privacy policy
          </Link>
          .
        </p>

        {showDetails ? (
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
                <span className="font-bold text-foreground">Essential</span>
                <span className="mt-1 block text-muted-foreground">
                  Required for security, session and core booking features.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                checked={analytics}
                className="mt-1"
                onChange={(event) => setAnalytics(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="font-bold text-foreground">Analytics</span>
                <span className="mt-1 block text-muted-foreground">
                  Helps us measure traffic and improve the product (GA4 / GTM).
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
                  Reserved for future ads pixels (Meta, Bing). Off by default
                  until you enable it.
                </span>
              </span>
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            className="h-11 rounded-full bg-foreground px-5 font-black text-background hover:bg-foreground/90"
            onClick={onAcceptAll}
            type="button"
          >
            Accept all
          </Button>
          <Button
            className="h-11 rounded-full px-5 font-black"
            onClick={onReject}
            type="button"
            variant="outline"
          >
            Essential only
          </Button>
          {showDetails ? (
            <Button
              className="h-11 rounded-full px-5 font-black"
              onClick={() => onSaveCustom(analytics, marketing)}
              type="button"
              variant="secondary"
            >
              Save choices
            </Button>
          ) : (
            <Button
              className="h-11 rounded-full px-5 font-black"
              onClick={() => setShowDetails(true)}
              type="button"
              variant="ghost"
            >
              Customise
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
