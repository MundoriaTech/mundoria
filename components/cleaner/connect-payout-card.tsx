"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/feedback/toast";

export function ConnectPayoutCard({
  hasStripeAccount,
  stripeComplete,
}: {
  hasStripeAccount: boolean;
  stripeComplete: boolean;
}) {
  const [busy, setBusy] = useState(false);

  if (stripeComplete) return null;

  async function connect() {
    setBusy(true);
    try {
      const response = await fetch(
        hasStripeAccount
          ? "/api/cleaner/stripe-dashboard"
          : "/api/cleaner/stripe-connect",
        {
          body: JSON.stringify({ returnTo: "/cleaner/dashboard" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const result = (await response.json()) as {
        error?: string;
        url?: string;
      };
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      toast.error("Couldn’t open Stripe", {
        action: { label: "Try again", onClick: () => void connect() },
        description: result.error ?? "Try again in a moment.",
      });
    } catch (err) {
      toast.error("Couldn’t open Stripe", {
        action: { label: "Try again", onClick: () => void connect() },
        description:
          err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-[#e8e0d6]/80 bg-white p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-gold">
        Payouts
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-brand-ink">
        Let’s get you paid
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c5670]">
        Connect Stripe Express with your UK bank details so Mundoria can send
        earnings from completed cleans. Bank details stay with Stripe — we never
        ask for your sort code or account number here.
      </p>
      <Button
        className="mt-5 h-11 rounded-full bg-brand-ink px-5 font-semibold text-white hover:bg-brand-indigo"
        loading={busy}
        loadingLabel="Opening Stripe…"
        onClick={() => void connect()}
        type="button"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {hasStripeAccount ? "Finish Stripe setup" : "Connect Stripe Express"}
      </Button>
    </section>
  );
}
