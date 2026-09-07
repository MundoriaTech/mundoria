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
          "group fixed z-[60] rounded-full transition hover:scale-110 active:scale-95 motion-safe:animate-[cookie-bob_2.8s_ease-in-out_infinite] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c79c66]",
          "bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))]",
          "sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:left-[max(1rem,env(safe-area-inset-left))]",
          className,
        )}
        onClick={handleClick}
        title="Cookie settings"
        type="button"
      >
        <CartoonCookieIcon
          className="h-14 w-14 transition group-hover:rotate-[-8deg] sm:h-[4.5rem] sm:w-[4.5rem]"
          size={72}
        />
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

/** Plain text control — use in footers like Wecasa’s “Cookies” link. */
export function CookieSettingsLink({
  className,
  children = "Cookies",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "text-sm font-medium text-muted-foreground transition hover:text-[#312c79]",
        className,
      )}
      onClick={() => openCookieSettings()}
      type="button"
    >
      {children}
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
