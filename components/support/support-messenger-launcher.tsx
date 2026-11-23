"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  SUPPORT_MESSENGER_EVENT,
  type SupportMessengerTab,
} from "@/components/support/support-messenger-events";
import {
  closeZohoSupportChat,
  mountZohoSupportChat,
  openZohoSupportChat,
  ZOHO_SALESIQ_READY_EVENT,
  zohoSalesIqConfigured,
} from "@/components/shared/zoho-salesiq";
import { openCookieSettings, readConsent } from "@/lib/analytics/consent";

const loadWidget = () =>
  import("@/components/support/support-messenger").then((module) => ({
    default: module.SupportMessengerWidget,
  }));

const SupportMessengerWidget = dynamic(loadWidget, {
  ssr: false,
  loading: () => <LauncherButton busy />,
});

const SupportSurfaceContext = createContext<(() => () => void) | null>(null);

/** One messenger outside the keyed page transition, shared by existing support surfaces. */
export function SupportMessengerProvider({ children }: { children: ReactNode }) {
  const surfaces = useRef(new Set<symbol>());
  const [enabled, setEnabled] = useState(false);
  const register = useCallback(() => {
    const surface = Symbol();
    surfaces.current.add(surface);
    setEnabled(true);
    return () => {
      surfaces.current.delete(surface);
      // The outgoing page can unmount before the incoming page registers.
      // Keep the conversation open across that same navigation commit.
      queueMicrotask(() => {
        if (surfaces.current.size === 0) setEnabled(false);
      });
    };
  }, []);

  return (
    <SupportSurfaceContext.Provider value={register}>
      {children}
      <SupportMessenger enabled={enabled} />
    </SupportSurfaceContext.Provider>
  );
}

/** Marks a page that offers support; the shared provider owns the widget. */
export function SupportMessengerLauncher() {
  const register = useContext(SupportSurfaceContext);
  useEffect(() => register?.(), [register]);
  return null;
}

function SupportMessenger({ enabled }: { enabled: boolean }) {
  const useZoho = zohoSalesIqConfigured();
  const [request, setRequest] = useState<{ tab: SupportMessengerTab } | null>(null);
  const [busy, setBusy] = useState(false);
  const [zohoReady, setZohoReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const active = useRef(false);
  const opening = useRef(false);

  const launch = useCallback(async (tab: SupportMessengerTab) => {
    if (!active.current || opening.current) return;
    if (useZoho && !readConsent()?.analytics) {
      openCookieSettings();
      return;
    }
    opening.current = true;
    setBusy(true);
    setUnavailable(false);
    const opened = useZoho && await openZohoSupportChat();
    opening.current = false;
    setBusy(false);
    if (!active.current) {
      if (opened) closeZohoSupportChat();
      return;
    }
    if (useZoho) setUnavailable(!opened);
    if (!opened && !useZoho) setRequest({ tab });
  }, [useZoho]);

  useEffect(() => {
    active.current = enabled;
    if (!enabled) return;
    let generation = 0;
    function refresh() {
      const current = ++generation;
      if (!useZoho) return;
      if (!readConsent()?.analytics) {
        setZohoReady(false);
        closeZohoSupportChat();
        return;
      }
      void mountZohoSupportChat().then((ready) => {
        if (active.current && current === generation) {
          setZohoReady(ready);
          if (ready) setUnavailable(false);
        }
      });
    }
    function onConsentChange() {
      refresh();
    }
    refresh();
    window.addEventListener("mundoria:consent-updated", onConsentChange);
    window.addEventListener(ZOHO_SALESIQ_READY_EVENT, refresh);
    return () => {
      generation++;
      active.current = false;
      if (useZoho) closeZohoSupportChat();
      window.removeEventListener("mundoria:consent-updated", onConsentChange);
      window.removeEventListener(ZOHO_SALESIQ_READY_EVENT, refresh);
    };
  }, [enabled, useZoho]);

  useEffect(() => {
    if (!enabled || request) return;
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ tab?: SupportMessengerTab }>).detail;
      void launch(detail?.tab ?? "home");
    }
    window.addEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
    return () => window.removeEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
  }, [enabled, launch, request]);

  if (!enabled || (useZoho && zohoReady)) return null;

  if (request) {
    return <SupportMessengerWidget initialOpen initialTab={request.tab} />;
  }

  return (
    <LauncherButton
      busy={busy}
      unavailable={unavailable}
      onClick={() => void launch("home")}
      onPreload={useZoho ? undefined : () => void loadWidget()}
    />
  );
}

function LauncherButton({
  busy = false,
  unavailable = false,
  onClick,
  onPreload,
}: {
  busy?: boolean;
  unavailable?: boolean;
  onClick?: () => void;
  onPreload?: () => void;
}) {
  return (
    <div className="support-messenger-dock pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {unavailable ? (
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-border bg-white p-4 text-sm shadow-lg" role="status">
          Chat couldn’t load. Please try again, or visit our{" "}
          <a className="underline" href="/help">Help Centre</a>.
        </div>
      ) : null}
      <button
        aria-busy={busy || undefined}
        aria-label="Open support chat"
        className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1c133b] text-white transition hover:bg-[#15102e]"
        onClick={onClick}
        onFocus={onPreload}
        onPointerEnter={onPreload}
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- transparent white brand mark, same as the widget */}
        <img
          alt=""
          className={busy ? "object-contain motion-safe:animate-pulse" : "object-contain"}
          height={26}
          src="/images/brand/mundoria-mark-white.png"
          width={26}
        />
      </button>
    </div>
  );
}
