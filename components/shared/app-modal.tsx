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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
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
          "relative flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-xl outline-none sm:rounded-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          "pb-[env(safe-area-inset-bottom)] sm:pb-0",
          className,
        )}
        ref={panelRef}
        tabIndex={-1}
      >
        {accent === "peach" ? (
          <div aria-hidden className="h-1 w-full shrink-0 bg-[#ffc79f]" />
        ) : null}
        {accent === "destructive" ? (
          <div aria-hidden className="h-1 w-full shrink-0 bg-destructive" />
        ) : null}

        <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">
          {showClose ? (
            <button
              aria-label="Close"
              className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={closeDisabled}
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}

          <h2
            className="pr-10 text-xl font-semibold tracking-tight text-foreground"
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
