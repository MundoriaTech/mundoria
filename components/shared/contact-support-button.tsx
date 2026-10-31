"use client";

import type { CSSProperties } from "react";

import { openSupportMessenger } from "@/components/support/support-messenger";
import { cn } from "@/lib/utils";

type SupportTab = "home" | "messages" | "help";

/**
 * Opens the Mundoria support messenger (Home / Messages / Help).
 * Label stays generic, never mentions the chat provider or email.
 */
export function ContactSupportButton({
  className,
  label = "Contact us",
  style,
  tab = "messages",
}: {
  className?: string;
  label?: string;
  style?: CSSProperties;
  tab?: SupportTab;
}) {
  return (
    <button
      className={cn(className)}
      onClick={() => {
        openSupportMessenger(tab);
      }}
      style={style}
      type="button"
    >
      {label}
    </button>
  );
}
