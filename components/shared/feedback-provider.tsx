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
import {
  SuccessModal,
  type SuccessKind,
} from "@/components/shared/success-modal";
import { AppModal } from "@/components/shared/app-modal";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmOptions = {
  action: string;
  description?: string;
  title: string;
  variant?: ButtonProps["variant"];
};

type SuccessOptions = {
  actionLabel?: string;
  autoCloseMs?: number | false;
  kind?: SuccessKind;
  note?: string;
  title: string;
};

type ErrorOptions = {
  actionLabel?: string;
  description?: string;
  title: string;
};

type FeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  error: (options: ErrorOptions) => void;
  success: (options: SuccessOptions) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [successState, setSuccessState] = useState<SuccessOptions | null>(null);
  const [errorState, setErrorState] = useState<ErrorOptions | null>(null);
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
    setSuccessState(options);
  }, []);

  const error = useCallback((options: ErrorOptions) => {
    setErrorState(options);
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

      {successState ? (
        <SuccessModal
          actionLabel={successState.actionLabel}
          autoCloseMs={successState.autoCloseMs}
          kind={successState.kind}
          note={successState.note}
          onClose={() => setSuccessState(null)}
          title={successState.title}
        />
      ) : null}

      {errorState ? (
        <AppModal
          accent="destructive"
          description={errorState.description}
          onClose={() => setErrorState(null)}
          title={errorState.title}
        >
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setErrorState(null)} variant="outline">
              {errorState.actionLabel ?? "Close"}
            </Button>
          </div>
        </AppModal>
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
