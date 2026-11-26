"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const MIN_POUNDS = 1;
const MAX_POUNDS = 100;

function declinedKey(bookingId: string) {
  return `mundoria:tip-declined:${bookingId}`;
}

/** Parse "5", "5.5" or "£5.50" into pence; null when it isn't a valid amount. */
function toPence(value: string) {
  const cleaned = value.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function TipPanel({
  bookingId,
  onTipped,
}: {
  bookingId: string;
  onTipped: () => void;
}) {
  const [step, setStep] = useState<"ask" | "amount" | "declined">("ask");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(declinedKey(bookingId))) setStep("declined");
  }, [bookingId]);

  const pence = toPence(amount);
  const valid =
    pence !== null && pence >= MIN_POUNDS * 100 && pence <= MAX_POUNDS * 100;

  function decline() {
    window.localStorage.setItem(declinedKey(bookingId), "1");
    setStep("declined");
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || pence === null) {
      setError(`Enter an amount between £${MIN_POUNDS} and £${MAX_POUNDS}.`);
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/tip`, {
        body: JSON.stringify({ amountPence: pence }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = (await res.json()) as {
        clientSecret?: string;
        error?: string;
        requiresAction?: boolean;
      };
      if (!res.ok) throw new Error(json.error ?? "The tip wasn't taken.");

      if (json.requiresAction && json.clientSecret) {
        // The bank wants to confirm it's you; no card details are needed.
        const stripe = stripePromise ? await stripePromise : null;
        if (!stripe) throw new Error("Card checks aren't available here. Try again later.");
        const result = await stripe.handleNextAction({ clientSecret: json.clientSecret });
        if (result.error || result.paymentIntent?.status !== "succeeded") {
          throw new Error(result.error?.message ?? "Your bank didn't approve the tip.");
        }
        const confirmRes = await fetch(`/api/bookings/${bookingId}/tip/confirm`, {
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const confirmJson = (await confirmRes.json()) as { error?: string };
        if (!confirmRes.ok) throw new Error(confirmJson.error ?? "Unable to record the tip.");
      }
      onTipped();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the tip.");
    } finally {
      setWorking(false);
    }
  }

  if (step === "declined") return null;

  return (
    <section className="rounded-xl border bg-background p-4 sm:p-5">
      <h2 className="text-lg font-semibold">Would you like to leave a tip?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tipping is entirely up to you. The whole tip goes to your cleaner. Tips are open
        for 24 hours after the clean.
      </p>

      {step === "ask" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setStep("amount")} type="button">
            Yes, leave a tip
          </Button>
          <Button onClick={decline} type="button" variant="outline">
            No thanks
          </Button>
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={(event) => void send(event)}>
          <label className="block text-sm font-medium" htmlFor={`tip-${bookingId}`}>
            Tip amount
          </label>
          <div className="relative max-w-[12rem]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              £
            </span>
            <Input
              autoFocus
              className="pl-7"
              id={`tip-${bookingId}`}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              value={amount}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Between £{MIN_POUNDS} and £{MAX_POUNDS}. It&apos;s charged to the card you
            booked with, so there&apos;s nothing else to enter.
          </p>
          {error ? <ActionError message={error} title="Tip not taken" /> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={working || !valid} type="submit">
              {working
                ? "Sending tip…"
                : valid && pence !== null
                  ? `Tip £${(pence / 100).toFixed(2)}`
                  : "Send tip"}
            </Button>
            <Button disabled={working} onClick={decline} type="button" variant="outline">
              No thanks
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
