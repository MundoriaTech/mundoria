"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  SUPPORT_MESSENGER_EVENT,
  type SupportMessengerTab,
} from "@/components/support/support-messenger-events";
import {
  closeZohoSupportChat,
  mountZohoSupportChat,
  openZohoSupportChat,
  zohoSalesIqConfigured,
} from "@/components/shared/zoho-salesiq";
import { readConsent } from "@/lib/analytics/consent";

const loadWidget = () =>
  import("@/components/support/support-messenger").then((module) => ({
    default: module.SupportMessengerWidget,
  }));

const SupportMessengerWidget = dynamic(loadWidget, {
  ssr: false,
  loading: () => <LauncherButton busy />,
});

/**
 * Marketing pages with SalesIQ configured use Zoho’s own launcher after
 * statistics consent. Booking and other in-app pages keep the Mundoria
 * messenger.
 */
export function SupportMessengerLauncher({ allowZoho = false }: { allowZoho?: boolean }) {
  const useZoho = allowZoho && zohoSalesIqConfigured();
  const [request, setRequest] = useState<{ tab: SupportMessengerTab } | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const opening = useRef(false);

  const launch = useCallback(async (tab: SupportMessengerTab) => {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    const opened = useZoho && await openZohoSupportChat();
    opening.current = false;
    if (!active.current) {
      if (opened) closeZohoSupportChat();
      return;
    }
    setBusy(false);
    if (!opened && !useZoho) setRequest({ tab });
  }, [useZoho]);

  useEffect(() => {
    active.current = true;
    if (useZoho) void mountZohoSupportChat();
    function onConsentChange() {
      if (!useZoho) return;
      if (readConsent()?.analytics) void mountZohoSupportChat();
      else closeZohoSupportChat();
    }
    window.addEventListener("mundoria:consent-updated", onConsentChange);
    return () => {
      active.current = false;
      if (useZoho) closeZohoSupportChat();
      window.removeEventListener("mundoria:consent-updated", onConsentChange);
    };
  }, [useZoho]);

  useEffect(() => {
    if (request) return;
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ tab?: SupportMessengerTab }>).detail;
      void launch(detail?.tab ?? "home");
    }
    window.addEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
    return () => window.removeEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
  }, [launch, request]);

  if (useZoho) return null;

  if (request) {
    return <SupportMessengerWidget initialOpen initialTab={request.tab} />;
  }

  return (
    <LauncherButton
      busy={busy}
      onClick={() => void launch("home")}
      onPreload={() => void loadWidget()}
    />
  );
}

function LauncherButton({
  busy = false,
  onClick,
  onPreload,
}: {
  busy?: boolean;
  onClick?: () => void;
  onPreload?: () => void;
}) {
  return (
    <div className="support-messenger-dock pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
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
