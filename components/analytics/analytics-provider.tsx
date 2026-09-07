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

    if (existing) {
      updateConsentMode(existing);
      if (existing.analytics) {
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
          onAllowAll={() =>
            save(
              createConsentPreferences({
                preferences: true,
                analytics: true,
                marketing: true,
              }),
            )
          }
          onDeny={() =>
            save(
              createConsentPreferences({
                preferences: false,
                analytics: false,
                marketing: false,
              }),
            )
          }
          onAllowSelection={(prefs) => save(createConsentPreferences(prefs))}
        />
      ) : null}
      {ready && !bannerOpen && analyticsConfigured() ? (
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
  onAllowAll,
  onDeny,
  onAllowSelection,
}: {
  current: ConsentPreferences | null;
  onAllowAll: () => void;
  onDeny: () => void;
  onAllowSelection: (
    prefs: Pick<ConsentPreferences, "preferences" | "analytics" | "marketing">,
  ) => void;
}) {
  const [showDetails, setShowDetails] = useState(Boolean(current));
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
              Of course, like you, we prefer real cookies. Those cookies allow
              us to personalise content and to analyse our traffic. We also
              share information about your use of our site with our partners
              (social media, ad personalisation and analytics).{" "}
              <Link
                className="font-bold text-primary underline-offset-2 hover:underline"
                href="/cookies"
              >
                Cookie management policy
              </Link>
              .
            </p>
            <p>
              Cookies are small text files that can be used by websites to make
              a user&apos;s experience more efficient. The law states that we
              can store cookies on your device if they are strictly necessary
              for the operation of this site. For all other types of cookies we
              need your permission.
            </p>
            <p>
              This site uses different types of cookies. Some cookies are placed
              by third party services that appear on our pages. You can at any
              time change or withdraw your consent from the{" "}
              <Link
                className="font-bold text-primary underline-offset-2 hover:underline"
                href="/cookies"
              >
                cookie policy
              </Link>{" "}
              on our website.
            </p>
            <p>
              Learn more about who we are, how you can contact us and how we
              process personal data in our{" "}
              <Link
                className="font-bold text-primary underline-offset-2 hover:underline"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

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
                  <span className="font-bold text-foreground">Necessary</span>
                  <span className="mt-1 block text-muted-foreground">
                    Necessary cookies help make a website usable by enabling
                    basic functions like page navigation and access to secure
                    areas of the website. The website cannot function properly
                    without these cookies.
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
                    Preference cookies enable a website to remember information
                    that changes the way the website behaves or looks, like your
                    preferred language or the region that you are in.
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
                    Statistic cookies help website owners to understand how
                    visitors interact with websites by collecting and reporting
                    information anonymously.
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
                    Marketing cookies are used to track visitors across
                    websites. The intention is to display ads that are relevant
                    and engaging for the individual user and thereby more
                    valuable for publishers and third party advertisers.
                  </span>
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              className="h-11 w-full rounded-full bg-foreground px-5 font-black text-background hover:bg-foreground/90 sm:w-auto"
              onClick={onAllowAll}
              type="button"
            >
              Allow all
            </Button>
            <Button
              className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
              onClick={onDeny}
              type="button"
              variant="outline"
            >
              Deny
            </Button>
            {showDetails ? (
              <Button
                className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
                onClick={() =>
                  onAllowSelection({
                    preferences: prefsEnabled,
                    analytics: statistics,
                    marketing,
                  })
                }
                type="button"
                variant="secondary"
              >
                Allow selection
              </Button>
            ) : (
              <Button
                className="h-11 w-full rounded-full px-5 font-black sm:w-auto"
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
    </div>
  );
}
