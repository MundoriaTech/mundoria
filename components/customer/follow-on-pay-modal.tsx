"use client";

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/customer/services";
import { PAYMENT_HELP_HREF } from "@/lib/customer/payment-status";
import Link from "next/link";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PayForm({
  amount,
  bookingId,
  onClose,
  onPaid,
}: {
  amount: number;
  bookingId: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    try {
      const intentRes = await fetch("/api/payments/create-intent", {
        body: JSON.stringify({ booking_id: bookingId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const intentJson = (await intentRes.json()) as {
        client_secret?: string;
        error?: string;
      };
      if (!intentRes.ok || !intentJson.client_secret) {
        throw new Error(intentJson.error ?? "Could not start payment.");
      }

      const result = await stripe.confirmCardPayment(intentJson.client_secret, {
        payment_method: { card },
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Payment failed.");
      }
      const status = result.paymentIntent?.status;
      if (status !== "requires_capture" && status !== "succeeded") {
        throw new Error("Payment was not authorised. Please try again.");
      }

      const confirmRes = await fetch(
        `/api/bookings/${bookingId}/confirm-payment`,
        { method: "POST" },
      );
      const confirmJson = (await confirmRes.json()) as { error?: string };
      if (!confirmRes.ok) {
        throw new Error(confirmJson.error ?? "Could not confirm payment.");
      }

      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
      <p className="text-sm leading-6 text-muted-foreground">
        Authorise a hold of{" "}
        <span className="font-semibold text-foreground">
          {formatMoney(amount)}
        </span>
        . You’re only charged after the clean.{" "}
        <Link
          className="font-medium text-primary underline-offset-2 hover:underline"
          href={PAYMENT_HELP_HREF}
        >
          How payment works
        </Link>
      </p>
      <div className="rounded-xl border bg-muted/40 p-4">
        <CardElement
          options={{
            style: {
              base: {
                color: "#1c133b",
                fontFamily: "inherit",
                fontSize: "16px",
              },
            },
          }}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          disabled={processing}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={processing || !stripe} type="submit">
          {processing ? "Authorising…" : "Authorise payment"}
        </Button>
      </div>
    </form>
  );
}

export function FollowOnPayModal({
  amount,
  bookingId,
  onClose,
  onPaid,
}: {
  amount: number;
  bookingId: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  if (!stripePromise) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-md rounded-t-2xl bg-background p-5 sm:rounded-2xl">
          <h2 className="text-lg font-semibold">Authorise payment</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable card payments.
          </p>
          <Button className="mt-4" onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-5">
        <h2 className="text-lg font-semibold">Authorise payment</h2>
        <div className="mt-4">
          <Elements stripe={stripePromise}>
            <PayForm
              amount={amount}
              bookingId={bookingId}
              onClose={onClose}
              onPaid={onPaid}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
