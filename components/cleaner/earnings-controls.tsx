"use client";

import { useState } from "react";

import {
  StripeEmbeddedPayouts,
  useStripeEmbeddedPayouts,
} from "@/components/cleaner/stripe-embedded-payouts";
import { SectionHeading } from "@/components/customer/dashboard/section-banner";
import { useFeedback } from "@/components/shared/feedback-provider";
import { createBrowserClient } from "@/lib/supabase/client";

export function EarningsControls({
  preference,
}: {
  preference: "weekly" | "monthly";
}) {
  const { success, error: showError } = useFeedback();
  const payouts = useStripeEmbeddedPayouts();
  const [value, setValue] = useState(preference);
  const [saving, setSaving] = useState(false);

  async function change(next: "weekly" | "monthly") {
    setSaving(true);
    setValue(next);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in again to update payouts.");
      const { error } = await supabase
        .from("cleaner_profiles")
        .update({ payout_preference: next })
        .eq("id", user.id);
      if (error) throw error;
      success({
        kind: "sent",
        title: "Payout schedule updated",
        note: next === "weekly" ? "Paid weekly." : "Paid monthly.",
      });
    } catch (err) {
      setValue(preference);
      showError({
        description: err instanceof Error ? err.message : "Try again.",
        onRetry: () => void change(next),
        title: "Couldn’t update your payout schedule",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
        <SectionHeading title="Payout schedule" />
        <p className="m-0 text-[14px] leading-5 text-[#5F5F66]">
          Completed cleans are held until capture, then paid out on your
          schedule.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div
            aria-label="Payout frequency"
            className="grid w-[11.5rem] grid-cols-2 gap-1 rounded-[12px] bg-[#E7E7EF] p-1"
            role="tablist"
          >
            {(["weekly", "monthly"] as const).map((option) => {
              const active = value === option;
              return (
                <button
                  aria-selected={active}
                  className="h-9 rounded-[9px] text-[13px] font-semibold capitalize transition-colors disabled:opacity-50"
                  disabled={saving}
                  key={option}
                  onClick={() => void change(option)}
                  role="tab"
                  style={{
                    background: active ? "#524096" : "transparent",
                    border: "none",
                    color: active ? "#FFFFFF" : "#524096",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>

          <button
            className="bg-transparent p-0 text-[13px] font-semibold text-[#524096] underline underline-offset-2 transition hover:text-[#3d2f75] disabled:opacity-50"
            disabled={payouts.busy}
            onClick={() => void payouts.start("management")}
            type="button"
          >
            {payouts.busy ? "Loading…" : "Manage payout details"}
          </button>
        </div>
        {payouts.error ? (
          <p className="m-0 text-[13px] text-[#9A2B18]">{payouts.error}</p>
        ) : null}
      </section>

      <StripeEmbeddedPayouts
        bankFocused={payouts.bankFocused}
        mode={payouts.mode}
        onClose={payouts.close}
        open={payouts.open}
        title="Manage payout details"
      />
    </>
  );
}
