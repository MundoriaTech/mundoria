"use client";

import { Heart } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { formatMoney } from "@/lib/customer/services";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const MIN_POUNDS = 1;
const MAX_POUNDS = 100;
const PRESETS = [200, 500, 1000] as const;

const amountBtn =
  "inline-flex h-9 w-[4.5rem] shrink-0 items-center justify-center rounded-full text-[13.5px] font-semibold transition";

/** Parse "5", "5.5" or "£5.50" into pence; null when it isn't a valid amount. */
function toPence(value: string) {
  const cleaned = value.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function TipPanel({
  bookingId,
  initiallyCollapsed = false,
  onTipped,
}: {
  bookingId: string;
  /** Soft “maybe later” state: panel stays visible, just compact. */
  initiallyCollapsed?: boolean;
  onTipped: () => void;
}) {
  const [preset, setPreset] = useState<number | "other">(500);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  const pence =
    preset === "other" ? toPence(custom) : preset;
  const valid =
    pence !== null && pence >= MIN_POUNDS * 100 && pence <= MAX_POUNDS * 100;

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

  if (collapsed) {
    return (
      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ECE8F6]"
          >
            <Heart className="h-4 w-4 fill-[#524096] text-[#524096]" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
              Tip when you&apos;re ready
            </p>
            <p className="m-0 mt-0.5 text-[13.5px] text-[#5F5F66]">
              100% goes to your cleaner. You can come back to this anytime.
            </p>
          </div>
        </div>
        <button
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#D4CCEA] bg-[#F3F4F6] px-4 text-[13.5px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
          onClick={() => setCollapsed(false)}
          style={{ cursor: "pointer", fontFamily: "inherit" }}
          type="button"
        >
          Leave a tip
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ECE8F6]"
        >
          <Heart className="h-5 w-5 fill-[#524096] text-[#524096]" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#1E1848] sm:text-[20px]">
            Show your cleaner some appreciation
          </h2>
          <p className="m-0 mt-1 text-[14px] leading-5 text-[#5F5F66]">
            Happy with your clean? A little thank you can go a long way.
          </p>
        </div>
      </div>

      <form className="mt-5" onSubmit={(event) => void send(event)}>
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#524096]/70">
          Choose an amount
        </p>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRESETS.map((value) => {
            const active = preset === value;
            return (
              <button
                className={amountBtn}
                key={value}
                onClick={() => {
                  setPreset(value);
                  setError(null);
                }}
                style={{
                  border: active ? "none" : "1.5px solid #D4CCEA",
                  background: active ? "#524096" : "#F3F4F6",
                  color: active ? "#FFFFFF" : "#524096",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                type="button"
              >
                £{value / 100}
              </button>
            );
          })}
          <button
            className={amountBtn}
            onClick={() => {
              setPreset("other");
              setError(null);
            }}
            style={{
              border: preset === "other" ? "none" : "1.5px solid #D4CCEA",
              background: preset === "other" ? "#524096" : "#F3F4F6",
              color: preset === "other" ? "#FFFFFF" : "#524096",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            type="button"
          >
            Other
          </button>
        </div>

        {preset === "other" ? (
          <div className="mt-3 w-[11.5rem]">
            <label
              className="block text-[13px] font-medium text-[#5F5F66]"
              htmlFor={`tip-${bookingId}`}
            >
              Enter your tip amount (£)
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#8B8798]">
                £
              </span>
              <input
                autoFocus
                className="h-10 w-full rounded-full border-[1.5px] border-[#E1E1EA] bg-[#F3F4F6] pl-7 pr-4 text-[15px] text-[#1E1848] outline-none transition focus:border-[#524096] focus:bg-white"
                id={`tip-${bookingId}`}
                inputMode="decimal"
                onChange={(event) => setCustom(event.target.value)}
                placeholder="0.00"
                value={custom}
              />
            </div>
          </div>
        ) : null}

        <p className="m-0 mt-3 text-[13.5px] text-[#5F5F66]">
          100% of your tip goes to your cleaner.
        </p>

        {error ? (
          <div className="mt-3">
            <ActionError message={error} title="Tip not taken" />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-55"
            disabled={working || !valid}
            style={{ background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)" }}
            type="submit"
          >
            {working
              ? "Sending tip…"
              : valid && pence !== null
                ? `Send ${formatMoney(pence)} tip`
                : "Send tip"}
          </button>
          <button
            className="border-0 bg-transparent text-[13.5px] font-semibold text-[#524096] underline-offset-2 hover:underline"
            disabled={working}
            onClick={() => setCollapsed(true)}
            style={{ cursor: "pointer", fontFamily: "inherit" }}
            type="button"
          >
            Maybe later
          </button>
        </div>

        <p className="m-0 mt-3 text-[12.5px] text-[#8B8798]">
          Tipping is entirely optional. Charged to the card on this booking, nothing else to enter.
        </p>
      </form>
    </section>
  );
}
