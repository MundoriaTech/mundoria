"use client";

import {
  loadConnectAndInitialize,
  type CollectionOptions,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectAccountManagement,
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectNotificationBanner,
} from "@stripe/react-connect-js";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";

type Mode = "onboarding" | "management";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/** Hide Mundoria-owned / prefilled business fields; collect bank (and any remaining KYC). */
const EXCLUDE_PLATFORM_FIELDS: CollectionOptions = {
  fields: "currently_due",
  futureRequirements: "omit",
  requirements: {
    exclude: [
      "business_type",
      "business_profile.mcc",
      "business_profile.product_description",
      "business_profile.url",
      "business_profile.*",
    ],
  },
};

/** When identity is already satisfied, only bank / payout details. */
const BANK_ONLY_FIELDS: CollectionOptions = {
  fields: "currently_due",
  futureRequirements: "omit",
  requirements: {
    only: ["external_account"],
  },
};

async function fetchAccountSession() {
  const response = await fetch("/api/cleaner/stripe-connect", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  let result: {
    bankFocused?: boolean;
    clientSecret?: string;
    error?: string;
  } = {};
  try {
    result = (await response.json()) as {
      bankFocused?: boolean;
      clientSecret?: string;
      error?: string;
    };
  } catch {
    throw new Error(
      response.ok
        ? "Unable to start payout setup."
        : `Payout setup failed (${response.status}). Try again in a moment.`,
    );
  }
  if (!response.ok || !result.clientSecret) {
    throw new Error(result.error ?? "Unable to start payout setup.");
  }
  return {
    bankFocused: Boolean(result.bankFocused),
    clientSecret: result.clientSecret,
  };
}

async function fetchAccountSessionClientSecret() {
  const session = await fetchAccountSession();
  return session.clientSecret;
}

function createConnectInstance() {
  if (!PUBLISHABLE_KEY) {
    throw new Error(
      "Stripe is not configured yet. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
    );
  }

  return loadConnectAndInitialize({
    appearance: {
      overlays: "dialog",
      variables: {
        buttonPrimaryColorBackground: "#1c133b",
        buttonPrimaryColorBorder: "#1c133b",
        buttonPrimaryColorText: "#ffffff",
        colorPrimary: "#1c133b",
        colorText: "#1c133b",
        colorSecondaryText: "#5c5670",
        borderRadius: "16px",
        fontFamily: "inherit",
      },
    },
    fetchClientSecret: fetchAccountSessionClientSecret,
    fonts: [],
    locale: "en-GB",
    publishableKey: PUBLISHABLE_KEY,
  });
}

export function StripeEmbeddedPayouts({
  bankFocused,
  mode,
  onClose,
  open,
  title,
}: {
  bankFocused: boolean;
  mode: Mode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);

  const collectionOptions = useMemo(
    () => (bankFocused || mode === "management" ? BANK_ONLY_FIELDS : EXCLUDE_PLATFORM_FIELDS),
    [bankFocused, mode],
  );

  useEffect(() => {
    if (!open) {
      setInstance(null);
      setError(null);
      return;
    }

    let cancelled = false;
    try {
      const next = createConnectInstance();
      if (!cancelled) setInstance(next);
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Unable to load Stripe.");
      }
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleExit = useCallback(() => {
    onClose();
    router.refresh();
  }, [onClose, router]);

  const subtitle = useMemo(() => {
    if (mode === "management" || bankFocused) {
      return "Add or update your bank account for payouts. Details go straight to Stripe.";
    }
    return "Confirm payout details without leaving Mundoria. Bank details go straight to Stripe.";
  }, [bankFocused, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1c133b]/45 p-0 sm:items-center sm:p-6">
      <div
        aria-modal="true"
        className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-[#e8e0d6] bg-[#faf8f5] shadow-[0_24px_60px_rgba(28,19,59,0.28)] sm:max-h-[90dvh] sm:rounded-[1.75rem]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebe4da] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
              Payouts
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#1c133b]">
              {title}
            </h2>
            <p className="mt-1 max-w-md text-sm leading-5 text-[#5c5670]">
              {subtitle}
            </p>
          </div>
          <Button
            aria-label="Close payout setup"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={handleExit}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error ? (
            <ActionError message={error} title="Couldn’t open payout setup" />
          ) : instance ? (
            <ConnectComponentsProvider connectInstance={instance}>
              <div className="mb-4">
                <ConnectNotificationBanner collectionOptions={collectionOptions} />
              </div>
              {mode === "onboarding" ? (
                <ConnectAccountOnboarding
                  collectionOptions={collectionOptions}
                  onExit={handleExit}
                />
              ) : (
                <ConnectAccountManagement collectionOptions={collectionOptions} />
              )}
            </ConnectComponentsProvider>
          ) : (
            <p className="text-sm text-[#5c5670]">Loading payout setup…</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function useStripeEmbeddedPayouts() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("onboarding");
  const [bankFocused, setBankFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (nextMode: Mode) => {
    setBusy(true);
    setError(null);
    try {
      // Warm the Account Session before mounting Connect.js so we surface
      // auth / approval errors before opening the overlay.
      const session = await fetchAccountSession();
      setBankFocused(session.bankFocused);
      setMode(nextMode);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { bankFocused, busy, close, error, mode, open, start };
}
