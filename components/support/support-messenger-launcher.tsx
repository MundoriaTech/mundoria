"use client";

import { useEffect } from "react";

import { SUPPORT_MESSENGER_EVENT } from "@/components/support/support-messenger-events";
import {
  closeZohoSupportChat,
  mountZohoSupportChat,
  openZohoSupportChat,
  zohoSalesIqConfigured,
} from "@/components/shared/zoho-salesiq";
import { readConsent } from "@/lib/analytics/consent";

/**
 * Mounts Zoho SalesIQ as the site support chat (marketing, help, Mag, booking).
 * “Contact us” / “Start a chat” buttons open the same window.
 */
export function SupportMessengerLauncher() {
  useEffect(() => {
    if (!zohoSalesIqConfigured()) return;

    void mountZohoSupportChat();

    function onConsentChange() {
      if (readConsent()?.analytics) void mountZohoSupportChat();
      else closeZohoSupportChat();
    }

    function onOpen() {
      void openZohoSupportChat();
    }

    window.addEventListener("mundoria:consent-updated", onConsentChange);
    window.addEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
    return () => {
      closeZohoSupportChat();
      window.removeEventListener("mundoria:consent-updated", onConsentChange);
      window.removeEventListener(SUPPORT_MESSENGER_EVENT, onOpen);
    };
  }, []);

  return null;
}
