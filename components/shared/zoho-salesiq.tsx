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
      url.protocol === "https:" && !url.port && !url.username && !url.password &&
      /^salesiq\.(?:zoho|zohopublic)\.(?:com|eu)$/.test(url.hostname) &&
      url.pathname === "/widget" && url.searchParams.get("wc")
    ) return url.href;
  } catch {
    // The built-in messenger is still available if the install URL is invalid.
  }
  return null;
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
      closeZohoSupportChat();
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

/** Loads SalesIQ on a support click after consent, with the site chat as fallback. */
export async function openZohoSupportChat() {
  const src = approvedScriptUrl();
  if (!src || !readConsent()?.analytics) return false;
  try {
    await loadWidget(src);
    if (!readConsent()?.analytics) return false;
    const widget = window.$zoho?.salesiq;
    const chat = widget?.chatwindow ?? widget?.floatwindow;
    if (!chat?.visible) return false;
    widget?.tracking?.off?.();
    widget?.floatbutton?.visible?.("hide");
    chat.visible("show");
    return true;
  } catch {
    return false;
  }
}
