"use client";

import type { CSSProperties } from "react";
import { openZohoSupportChat } from "@/components/shared/zoho-salesiq";
import { cn } from "@/lib/utils";

/**
 * Opens in-app support chat when the widget is configured.
 * Label stays generic — never mentions the chat provider or email.
 */
export function ContactSupportButton({
  className,
  label = "Contact us",
  style,
}: {
  className?: string;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      className={cn(className)}
      onClick={() => {
        openZohoSupportChat();
      }}
      style={style}
      type="button"
    >
      {label}
    </button>
  );
}
