"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border border-border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312c79]",
        isDark ? "bg-[#1c133b]" : "bg-[#ece3f9]",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="switch"
      type="button"
    >
      <Sun
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1.5 h-3.5 w-3.5 transition-opacity",
          isDark ? "text-[#c79c66]/55 opacity-60" : "text-[#c79c66] opacity-100",
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-1.5 h-3.5 w-3.5 transition-opacity",
          isDark ? "text-[#e6e5f3] opacity-100" : "text-[#312c79]/45 opacity-60",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
          isDark && "translate-x-[1.35rem]",
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-[#1c133b]" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-[#c79c66]" />
        )}
      </span>
    </button>
  );
}
