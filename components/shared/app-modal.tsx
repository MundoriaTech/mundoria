"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { DURATION, EASE, popIn, sheetUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MOBILE_QUERY = "(max-width: 639px)";
/** Longest exit the panel variants use, so unmount waits for it. */
const EXIT_MS = 280;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return mobile;
}

/**
 * Shared dialog. Pops in on desktop and slides up as a bottom sheet on
 * phones. Closing from inside the dialog (X, overlay, Escape) plays the
 * exit animation before `onClose` fires, so parents can keep conditionally
 * rendering it without wiring AnimatePresence themselves.
 */
export function AppModal({
  accent = "none",
  backdrop = "dim",
  children,
  className,
  closeClassName,
  closeDisabled = false,
  description,
  dismissOnOverlay = true,
  onClose,
  showClose = true,
  title,
}: {
  accent?: "none" | "peach" | "destructive";
  /** `dim` — soft dark scrim. `blur` — page blur only, no overlay tint. */
  backdrop?: "dim" | "blur";
  children: ReactNode;
  className?: string;
  closeClassName?: string;
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
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const closeTimer = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [present, setPresent] = useState(true);
  const mobile = useIsMobile();
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  /** Animate out, then tell the parent to unmount us. */
  const requestClose = useCallback(() => {
    if (closeTimer.current != null) return;
    setPresent(false);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onCloseRef.current();
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const field = panel.querySelector<HTMLElement>(
        "textarea, input, select",
      );
      (field ?? panel).focus();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabledRef.current) {
        event.preventDefault();
        requestClose();
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
  }, [requestClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {present ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-describedby={description ? descriptionId : undefined}
          aria-labelledby={titleId}
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4",
            backdrop === "blur"
              ? "bg-brand-ink/20 backdrop-blur-md"
              : "bg-slate-950/45 backdrop-blur-[2px]",
          )}
          exit={{
            opacity: 0,
            transition: { duration: DURATION.base, ease: EASE.in },
          }}
          initial={{ opacity: 0 }}
          key="app-modal"
          role="dialog"
          transition={{ duration: DURATION.base, ease: EASE.out }}
        >
          <button
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            disabled={closeDisabled || !dismissOnOverlay}
            onClick={() => {
              if (!closeDisabled && dismissOnOverlay) requestClose();
            }}
            type="button"
          />
          <motion.div
            animate="visible"
            className={cn(
              "relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-xl outline-none sm:rounded-2xl",
              "pb-[env(safe-area-inset-bottom)] sm:pb-0",
              className,
            )}
            exit="exit"
            initial="hidden"
            ref={panelRef}
            tabIndex={-1}
            variants={mobile ? sheetUp : popIn}
          >
            {accent === "peach" ? (
              <div aria-hidden className="h-1 w-full shrink-0 bg-brand-peach-light" />
            ) : null}
            {accent === "destructive" ? (
              <div aria-hidden className="h-1 w-full shrink-0 bg-destructive" />
            ) : null}

            {mobile ? (
              <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-brand-lavender" />
            ) : null}

            <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">
              {showClose ? (
                <button
                  aria-label="Close"
                  className={cn(
                    "absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
                    closeClassName,
                  )}
                  disabled={closeDisabled}
                  onClick={requestClose}
                  type="button"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
