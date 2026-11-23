"use client";

import type { CSSProperties, ReactNode } from "react";

import { openZohoSupportChat } from "@/components/shared/zoho-salesiq";
import { cn } from "@/lib/utils";

/**
 * Opens the site support chat (SalesIQ). Label stays generic.
 */
export function ContactSupportButton({
  className,
  label = "Contact us",
  style,
}: {
  className?: string;
  label?: ReactNode;
  style?: CSSProperties;
  /** @deprecated SalesIQ has a single window; ignored. */
  tab?: "home" | "messages" | "help";
}) {
  return (
    <button
      className={cn(className)}
      onClick={() => {
        void openZohoSupportChat();
      }}
      style={style}
      type="button"
    >
      {label}
    </button>
  );
}
