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
export const ZOHO_SALESIQ_READY_EVENT = "mundoria:salesiq-ready";
let loading: Promise<boolean> | undefined;
let ready = false;
let wanted = false;

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
    // Invalid install URL: keep the original Mundoria messenger available.
  }
  return null;
}

export function zohoSalesIqConfigured() {
  return Boolean(approvedScriptUrl());
}

function loadWidget(src: string) {
  if (ready) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const existing = document.getElementById("zsiqscript") as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    window.$zoho ??= {};
    window.$zoho.salesiq ??= {};
    window.$zoho.salesiq.ready = () => {
      ready = true;
      syncVisibility();
      resolve(true);
      window.dispatchEvent(new Event(ZOHO_SALESIQ_READY_EVENT));
    };
    script.id = "zsiqscript";
    script.src = src;
    script.async = true;
    script.onerror = () => {
      script.remove();
      loading = undefined;
      resolve(false);
    };
    if (!existing) document.body.appendChild(script);
  });
  return loading;
}

function syncVisibility() {
  const widget = window.$zoho?.salesiq;
  try {
    widget?.tracking?.off?.();
    if (wanted && readConsent()?.analytics) {
      widget?.floatbutton?.visible?.("show");
      return Boolean(widget?.floatbutton?.visible);
    }
    widget?.floatbutton?.visible?.("hide");
    (widget?.chatwindow ?? widget?.floatwindow)?.visible?.("hide");
  } catch {
    // The provider may still be loading, or already closed.
  }
  return false;
}

export function closeZohoSupportChat() {
  wanted = false;
  syncVisibility();
}

/** A timeout leaves the single script loading; a late ready event restores the launcher. */
function waitForWidget(pending: Promise<boolean>) {
  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => resolve(false), 8_000);
    void pending.then((loaded) => {
      window.clearTimeout(timeout);
      resolve(loaded);
    });
  });
}

/** Load SalesIQ after statistics consent and leave its own launcher visible. */
export async function mountZohoSupportChat() {
  const src = approvedScriptUrl();
  if (!src || !readConsent()?.analytics) {
    closeZohoSupportChat();
    return false;
  }
  wanted = true;
  try {
    const loaded = await waitForWidget(loadWidget(src));
    if (!wanted || !readConsent()?.analytics) {
      closeZohoSupportChat();
      return false;
    }
    return loaded && syncVisibility();
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
