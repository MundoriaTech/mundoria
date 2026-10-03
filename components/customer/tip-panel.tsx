"use client";

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/customer/services";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const TIP_AMOUNTS = [200, 500, 1000];

function TipForm({
  bookingId,
  onTipped,
}: {
  bookingId: string;
  onTipped: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(500);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setWorking(true);
    setError(null);
    try {
      const intentRes = await fetch(`/api/bookings/${bookingId}/tip`, {
        body: JSON.stringify({ amountPence: amount }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const intentJson = (await intentRes.json()) as {
        clientSecret?: string;
        error?: string;
      };
      if (!intentRes.ok || !intentJson.clientSecret) {
        throw new Error(intentJson.error ?? "Unable to start the tip.");
      }
      const result = await stripe.confirmCardPayment(intentJson.clientSecret, {
        payment_method: { card },
      });
      if (result.error || result.paymentIntent?.status !== "succeeded") {
        throw new Error(result.error?.message ?? "The tip was not taken.");
      }
      const confirmRes = await fetch(`/api/bookings/${bookingId}/tip/confirm`, {
        body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const confirmJson = (await confirmRes.json()) as { error?: string };
      if (!confirmRes.ok) {
        throw new Error(confirmJson.error ?? "Unable to record the tip.");
      }
      onTipped();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the tip.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={(event) => void pay(event)}>
      <div className="flex flex-wrap gap-2">
        {TIP_AMOUNTS.map((value) => (
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              amount === value
                ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                : "border-[#d9ccef] bg-white"
            }`}
            key={value}
            onClick={() => setAmount(value)}
            type="button"
          >
            {formatMoney(value)}
          </button>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-3">
        <CardElement />
      </div>
      {error ? <ActionError message={error} title="Tip not taken" /> : null}
      <Button disabled={working || !stripe} type="submit">
        {working ? "Sending tip…" : `Tip ${formatMoney(amount)}`}
      </Button>
    </form>
  );
}

export function TipPanel({
  bookingId,
  onTipped,
}: {
  bookingId: string;
  onTipped: () => void;
}) {
  return (
    <section className="rounded-xl border bg-background p-4 sm:p-5">
      <h2 className="text-lg font-semibold">Leave a tip</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tips are open for 24 hours after the clean.
      </p>
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <TipForm bookingId={bookingId} onTipped={onTipped} />
        </Elements>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Card payments are not configured in this environment.
        </p>
      )}
    </section>
  );
}
