"use client";

import { type ReactNode, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmModal({
  action,
  children,
  confirmDisabled = false,
  description,
  onCancel,
  onConfirm,
  title,
  variant = "destructive",
}: {
  action: string;
  children?: ReactNode;
  confirmDisabled?: boolean;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  variant?: ButtonProps["variant"];
}) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    setWorking(true);
    try {
      await onConfirm();
    } catch {
      setWorking(false);
      return;
    }
    // Parent may unmount on success; only clear spinner if still mounted for errors that keep the dialog open.
    setWorking(false);
  }

  return (
    <AppModal
      accent={variant === "destructive" ? "destructive" : "none"}
      closeDisabled={working}
      description={description}
      dismissOnOverlay={false}
      onClose={onCancel}
      title={title}
    >
      {children ? <div className="mt-4">{children}</div> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={working}
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={working || confirmDisabled}
          onClick={() => void confirm()}
          variant={variant}
        >
          {working ? (
            <LoadingSpinner className="text-current" label={action} />
          ) : (
            action
          )}
        </Button>
      </div>
    </AppModal>
  );
}
