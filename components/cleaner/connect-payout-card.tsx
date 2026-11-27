"use client";

import { CreditCard } from "lucide-react";

import {
  StripeEmbeddedPayouts,
  useStripeEmbeddedPayouts,
} from "@/components/cleaner/stripe-embedded-payouts";
import {
  pillPrimaryStyle,
  SectionHeading,
} from "@/components/customer/dashboard/section-banner";
import { ActionError } from "@/components/shared/action-error";

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
      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Payouts" />
        <div>
          <p className="m-0 text-[16px] font-semibold tracking-[-0.02em] text-[#1E1848]">
            Let&apos;s get you paid
          </p>
          <p className="m-0 mt-2 max-w-xl text-[14px] leading-5 text-[#5F5F66]">
            Set up payouts here in Mundoria. Your UK bank details go straight to
            Stripe - we never store your sort code or account number.
          </p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            disabled={payouts.busy}
            onClick={() => void payouts.start("onboarding")}
            style={pillPrimaryStyle}
            type="button"
          >
            <CreditCard className="h-4 w-4" />
            {payouts.busy
              ? "Loading…"
              : hasStripeAccount
                ? "Finish payout setup"
                : "Set up payouts"}
          </button>
          {payouts.error ? (
            <div className="mt-4">
              <ActionError
                message={payouts.error}
                title="Couldn’t open payout setup"
              />
            </div>
          ) : null}
        </div>
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
