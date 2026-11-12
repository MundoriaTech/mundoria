"use client";

import { useState } from "react";

import {
  StripeEmbeddedPayouts,
  useStripeEmbeddedPayouts,
} from "@/components/cleaner/stripe-embedded-payouts";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
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
      <div className="mt-6 rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium text-foreground">Payout schedule</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed cleans are held until capture, then paid out on your
          schedule.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["weekly", "monthly"] as const).map((option) => (
            <Button
              className="capitalize"
              disabled={saving}
              key={option}
              onClick={() => void change(option)}
              size="sm"
              variant={value === option ? "default" : "outline"}
            >
              {option}
            </Button>
          ))}
          <Button
            disabled={payouts.busy}
            onClick={() => void payouts.start("management")}
            variant="link"
          >
            {payouts.busy ? "Loading…" : "Manage payout details"}
          </Button>
        </div>
        {payouts.error ? (
          <p className="mt-2 text-sm text-destructive">{payouts.error}</p>
        ) : null}
      </div>

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
