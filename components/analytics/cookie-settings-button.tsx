"use client";

import { openCookieSettings } from "@/lib/analytics/consent";

export function CookieSettingsButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      className={
        className ??
        "text-sm font-bold text-muted-foreground transition hover:text-primary"
      }
      onClick={() => openCookieSettings()}
      type="button"
    >
      Cookie settings
    </button>
  );
}
