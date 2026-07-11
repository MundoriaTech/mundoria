"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

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

  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape" && !working) onCancel();
    }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onCancel, working]);

  async function confirm() {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      aria-labelledby="confirm-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <button
        aria-label="Close confirmation"
        className="absolute inset-0"
        disabled={working}
        onClick={onCancel}
        type="button"
      />
      <div className="relative w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
        <button
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"
          disabled={working}
          onClick={onCancel}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="pr-8 text-xl font-semibold" id="confirm-modal-title">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={working} onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={working || confirmDisabled}
            onClick={() => void confirm()}
            variant={variant}
          >
            {working ? <LoadingSpinner className="text-current" label={action} /> : action}
          </Button>
        </div>
      </div>
    </div>
  );
}
