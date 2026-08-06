"use client";

import { X } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

export function AppModal({
  accent = "none",
  children,
  className,
  closeDisabled = false,
  description,
  dismissOnOverlay = true,
  onClose,
  showClose = true,
  title,
}: {
  accent?: "none" | "peach" | "destructive";
  children: ReactNode;
  className?: string;
  closeDisabled?: boolean;
  description?: string;
  dismissOnOverlay?: boolean;
  onClose: () => void;
  showClose?: boolean;
  title: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabled) {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [closeDisabled, onClose]);

  return (
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        disabled={closeDisabled || !dismissOnOverlay}
        onClick={() => {
          if (!closeDisabled && dismissOnOverlay) onClose();
        }}
        type="button"
      />
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl outline-none",
          "animate-in fade-in zoom-in-95 duration-200",
          className,
        )}
        ref={panelRef}
        tabIndex={-1}
      >
        {accent === "peach" ? (
          <div aria-hidden className="h-1 w-full bg-[#ffc79f]" />
        ) : null}
        {accent === "destructive" ? (
          <div aria-hidden className="h-1 w-full bg-destructive" />
        ) : null}

        <div className="p-6">
          {showClose ? (
            <button
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={closeDisabled}
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          <h2
            className="pr-8 text-xl font-semibold tracking-tight text-foreground"
            id={titleId}
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mt-2 text-sm leading-6 text-muted-foreground"
              id={descriptionId}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
