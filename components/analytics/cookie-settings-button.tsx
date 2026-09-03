"use client";

import { CartoonCookieIcon } from "@/components/analytics/cartoon-cookie-icon";
import { openCookieSettings } from "@/lib/analytics/consent";
import { cn } from "@/lib/utils";

type CookieSettingsWidgetProps = {
  className?: string;
  /** Bare cookie icon for footers; larger floating cookie for the corner widget. */
  variant?: "inline" | "floating";
  onClick?: () => void;
};

export function CookieSettingsWidget({
  className,
  onClick,
  variant = "inline",
}: CookieSettingsWidgetProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openCookieSettings();
  };

  if (variant === "floating") {
    return (
      <button
        aria-label="Cookie settings"
        className={cn(
          "group fixed bottom-4 left-4 z-[60] rounded-full transition hover:scale-110 active:scale-95 motion-safe:animate-[cookie-bob_2.8s_ease-in-out_infinite] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c79c66]",
          className,
        )}
        onClick={handleClick}
        title="Cookie settings"
        type="button"
      >
        <CartoonCookieIcon className="transition group-hover:rotate-[-8deg]" size={72} />
        <span className="sr-only">Cookie settings</span>
      </button>
    );
  }

  return (
    <button
      aria-label="Cookie settings"
      className={cn(
        "group rounded-full transition hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c79c66]",
        className,
      )}
      onClick={handleClick}
      title="Cookie settings"
      type="button"
    >
      <CartoonCookieIcon
        className="transition group-hover:-rotate-6"
        size={56}
      />
      <span className="sr-only">Cookie settings</span>
    </button>
  );
}

/** @deprecated Use CookieSettingsWidget — kept as alias for existing imports. */
export function CookieSettingsButton({
  className,
}: {
  className?: string;
}) {
  return <CookieSettingsWidget className={className} variant="inline" />;
}
