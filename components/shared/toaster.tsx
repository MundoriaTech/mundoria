"use client";

import { CheckCircle2, CircleAlert, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * Brand-styled toast host. Mounted once in the root layout.
 * Fire toasts through `@/lib/feedback/toast`, not `sonner` directly, so the
 * copy and defaults stay consistent.
 */
export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      duration={4200}
      gap={10}
      icons={{
        close: <X className="h-3.5 w-3.5" strokeWidth={2.5} />,
        error: <CircleAlert className="h-5 w-5 text-brand-terracotta" />,
        info: <Info className="h-5 w-5 text-brand-purple" />,
        loading: (
          <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
        ),
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        warning: <TriangleAlert className="h-5 w-5 text-brand-gold" />,
      }}
      mobileOffset={{ bottom: 88, left: 16, right: 16, top: 16 }}
      offset={{ bottom: 24, left: 24, right: 24, top: 24 }}
      position="top-right"
      toastOptions={{
        classNames: {
          actionButton:
            "!rounded-full !bg-brand-ink !px-3 !text-xs !font-semibold !text-white hover:!bg-brand-plum",
          cancelButton:
            "!rounded-full !bg-brand-lavender-light !px-3 !text-xs !font-semibold !text-brand-ink",
          closeButton:
            "!border-brand-line !bg-white !text-brand-subtle hover:!bg-brand-surface hover:!text-brand-ink",
          description: "!text-[13px] !leading-5 !text-brand-muted",
          title: "!text-sm !font-semibold !text-brand-ink",
          toast:
            "!rounded-2xl !border !border-brand-line !bg-white !text-brand-ink !shadow-[0_18px_40px_rgba(28,19,59,0.12)] font-sans",
        },
      }}
      visibleToasts={4}
    />
  );
}
