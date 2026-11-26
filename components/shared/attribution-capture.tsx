"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { captureAttribution } from "@/lib/analytics/attribution";

/** Records where a visitor first came from (see lib/analytics/attribution). Renders nothing. */
export function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttribution();
  }, [pathname]);
  useEffect(() => {
    // Consent given on the landing page: record that page's ad parameters.
    const onConsent = () => captureAttribution();
    window.addEventListener("mundoria:consent-updated", onConsent);
    return () => window.removeEventListener("mundoria:consent-updated", onConsent);
  }, []);
  return null;
}
