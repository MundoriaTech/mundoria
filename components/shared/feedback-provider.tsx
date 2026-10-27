"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import type { ButtonProps } from "@/components/ui/button";
import { toast } from "@/lib/feedback/toast";

type ConfirmOptions = {
  action: string;
  description?: string;
  title: string;
  variant?: ButtonProps["variant"];
};

export type SuccessKind = "saved" | "deleted" | "updated" | "sent" | "done";

type SuccessOptions = {
  /** Kept for API compatibility; toasts have no action button by default. */
  actionLabel?: string;
  /** `false` keeps the toast until dismissed. Numbers are milliseconds. */
  autoCloseMs?: number | false;
  kind?: SuccessKind;
  note?: string;
  title: string;
};

type ErrorOptions = {
  actionLabel?: string;
  description?: string;
  onRetry?: () => void;
  title: string;
};

type FeedbackContextValue = {
  /** Blocking yes/no dialog. Resolves `true` when the user confirms. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Outcome toast for a failed action, with an optional retry button. */
  error: (options: ErrorOptions) => void;
  /** Outcome toast for a completed action. */
  success: (options: SuccessOptions) => void;
};

const TIDBITS: Record<SuccessKind, string[]> = {
  saved: [
    "Locked in. That’ll be ready next time you need it.",
    "Tucked away safely. Nice one.",
    "Saved and sorted — nothing more to do here.",
  ],
  deleted: ["Gone. Space cleared.", "Removed. No looking back.", "That’s out of the way."],
  updated: ["Fresh details, noted.", "All caught up on our side.", "Change applied. You’re good."],
  sent: ["On its way.", "Sent. They’ll see it shortly.", "Delivered to the queue."],
  done: ["That’s that — handled.", "Done. You can carry on.", "All set from here."],
};

function pickTidbit(kind: SuccessKind, note?: string) {
  if (note) return note;
  const options = TIDBITS[kind];
  return options[Math.floor(Date.now() / 1000) % options.length]!;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Confirm dialogs stay modal. Success and error outcomes are toasts, so a
 * finished action never steals focus or blocks the page.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);

  const settleConfirm = useCallback((value: boolean) => {
    confirmResolver.current?.(value);
    confirmResolver.current = null;
    setConfirmState(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current?.(false);
      confirmResolver.current = resolve;
      setConfirmState(options);
    });
  }, []);

  const success = useCallback((options: SuccessOptions) => {
    toast.success(options.title, {
      description: pickTidbit(options.kind ?? "done", options.note),
      duration:
        options.autoCloseMs === false
          ? Number.POSITIVE_INFINITY
          : options.autoCloseMs,
    });
  }, []);

  const error = useCallback((options: ErrorOptions) => {
    toast.error(options.title, {
      action: options.onRetry
        ? { label: options.actionLabel ?? "Try again", onClick: options.onRetry }
        : undefined,
      description: options.description,
    });
  }, []);

  const value = useMemo(
    () => ({ confirm, success, error }),
    [confirm, success, error],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {confirmState ? (
        <ConfirmModal
          action={confirmState.action}
          description={confirmState.description}
          onCancel={() => settleConfirm(false)}
          onConfirm={() => settleConfirm(true)}
          title={confirmState.title}
          variant={confirmState.variant}
        />
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
