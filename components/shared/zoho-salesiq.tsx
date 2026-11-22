"use client";

import { readConsent } from "@/lib/analytics/consent";

type Visibility = { visible?: (state: "show" | "hide") => void };

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        chatwindow?: Visibility;
        floatbutton?: Visibility;
        floatwindow?: Visibility;
        ready?: () => void;
        tracking?: { off?: () => void };
      };
    };
  }
}

const widgetSrc = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_SRC;
let loading: Promise<void> | undefined;

function approvedScriptUrl() {
  if (!widgetSrc) return null;
  try {
    const url = new URL(widgetSrc);
    if (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^salesiq\.(?:zoho|zohopublic)\.(?:com|eu)$/.test(url.hostname) &&
      url.pathname === "/widget" &&
      url.searchParams.get("wc")
    ) {
      return url.href;
    }
  } catch {
    // Invalid install URL: public pages stay without a launcher.
  }
  return null;
}

export function zohoSalesIqConfigured() {
  return Boolean(approvedScriptUrl());
}

function loadWidget(src: string) {
  if (loading) return loading;
  if (document.getElementById("zsiqscript")) return Promise.resolve();

  loading = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(resolve, 3_500);
    window.$zoho ??= {};
    window.$zoho.salesiq ??= {};
    window.$zoho.salesiq.ready = () => {
      window.clearTimeout(timeout);
      try {
        window.$zoho?.salesiq?.tracking?.off?.();
        window.$zoho?.salesiq?.floatbutton?.visible?.("show");
      } catch {
        // SalesIQ still owns the launcher once the script has loaded.
      }
      resolve();
    };
    script.id = "zsiqscript";
    script.src = src;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      loading = undefined;
      resolve();
    };
    document.body.appendChild(script);
  });
  return loading;
}

export function closeZohoSupportChat() {
  const widget = window.$zoho?.salesiq;
  try {
    widget?.tracking?.off?.();
    widget?.floatbutton?.visible?.("hide");
    (widget?.chatwindow ?? widget?.floatwindow)?.visible?.("hide");
  } catch {
    // The provider may still be loading, or already closed.
  }
}

/** Load SalesIQ after statistics consent and leave its own launcher visible. */
export async function mountZohoSupportChat() {
  const src = approvedScriptUrl();
  if (!src || !readConsent()?.analytics) return false;
  try {
    await loadWidget(src);
    if (!readConsent()?.analytics) {
      closeZohoSupportChat();
      return false;
    }
    const widget = window.$zoho?.salesiq;
    widget?.tracking?.off?.();
    widget?.floatbutton?.visible?.("show");
    return Boolean(widget?.floatbutton?.visible || widget?.chatwindow?.visible);
  } catch {
    return false;
  }
}

/** Open the SalesIQ window (footer “Start a chat”). */
export async function openZohoSupportChat() {
  const mounted = await mountZohoSupportChat();
  if (!mounted) return false;
  try {
    const widget = window.$zoho?.salesiq;
    const chat = widget?.chatwindow ?? widget?.floatwindow;
    if (!chat?.visible) return false;
    chat.visible("show");
    return true;
  } catch {
    return false;
  }
}
