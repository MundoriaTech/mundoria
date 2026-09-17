"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        chat?: { start?: () => void };
        floatwindow?: { visible?: (state: "show" | "hide") => void };
        ready?: (callback: () => void) => void;
      };
    };
  }
}

const WIDGET_CODE = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE;
const WIDGET_BASE =
  process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_URL ??
  "https://salesiq.zoho.eu/widget";

/** Opens Zoho SalesIQ chat when configured; returns false if unavailable. */
export function openZohoSupportChat(): boolean {
  if (typeof window === "undefined" || !WIDGET_CODE) return false;
  try {
    window.$zoho?.salesiq?.chat?.start?.();
    window.$zoho?.salesiq?.floatwindow?.visible?.("show");
    return Boolean(window.$zoho?.salesiq);
  } catch {
    return false;
  }
}

/**
 * Loads Zoho SalesIQ (Zoho One chat) for public marketing pages.
 * No-ops until NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE is set.
 */
export function ZohoSalesIqWidget() {
  useEffect(() => {
    if (!WIDGET_CODE || typeof window === "undefined") return;
    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || {
      ready: function ready() {
        // Widget initialised by SalesIQ script.
      },
    };
  }, []);

  if (!WIDGET_CODE) return null;

  return (
    <>
      <Script id="zoho-salesiq-bootstrap" strategy="afterInteractive">
        {`window.$zoho=window.$zoho||{};window.$zoho.salesiq=window.$zoho.salesiq||{ready:function(){}};`}
      </Script>
      <Script
        defer
        id="zsiqscript"
        src={`${WIDGET_BASE}?wc=${WIDGET_CODE}`}
        strategy="afterInteractive"
      />
    </>
  );
}
