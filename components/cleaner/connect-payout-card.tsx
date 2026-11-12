"use client";

import { CreditCard } from "lucide-react";

import {
  StripeEmbeddedPayouts,
  useStripeEmbeddedPayouts,
} from "@/components/cleaner/stripe-embedded-payouts";
import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";

export function ConnectPayoutCard({
  hasStripeAccount,
  stripeComplete,
}: {
  hasStripeAccount: boolean;
  stripeComplete: boolean;
}) {
  const payouts = useStripeEmbeddedPayouts();

  if (stripeComplete) return null;

  return (
    <>
      <section className="rounded-[1.75rem] border border-[#e8e0d6]/80 bg-white p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          Payouts
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          Let’s get you paid
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c5670]">
          Set up payouts here in Mundoria. Your UK bank details go straight to
          Stripe — we never store your sort code or account number.
        </p>
        <Button
          className="mt-5 h-11 rounded-full bg-[#1c133b] px-5 font-semibold text-white hover:bg-[#312c79]"
          disabled={payouts.busy}
          onClick={() => void payouts.start("onboarding")}
          type="button"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {payouts.busy
            ? "Loading…"
            : hasStripeAccount
              ? "Finish payout setup"
              : "Set up payouts"}
        </Button>
        {payouts.error ? (
          <div className="mt-4">
            <ActionError
              message={payouts.error}
              title="Couldn’t open payout setup"
            />
          </div>
        ) : null}
      </section>

      <StripeEmbeddedPayouts
        bankFocused={payouts.bankFocused}
        mode={payouts.mode}
        onClose={payouts.close}
        open={payouts.open}
        title={
          hasStripeAccount ? "Finish payout setup" : "Set up your payouts"
        }
      />
    </>
  );
}
