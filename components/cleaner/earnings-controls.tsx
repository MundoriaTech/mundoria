"use client";

import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

export function EarningsControls({
  preference,
}: {
  preference: "weekly" | "monthly";
}) {
  const { success, error: showError } = useFeedback();
  const [value, setValue] = useState(preference);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);

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
        title: "Could not update schedule",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function openDashboard() {
    setOpening(true);
    try {
      const response = await fetch("/api/cleaner/stripe-dashboard", {
        method: "POST",
      });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Stripe Express is not ready yet.");
      }
      window.location.assign(json.url);
    } catch (err) {
      showError({
        title: "Could not open Stripe",
        description: err instanceof Error ? err.message : "Try again later.",
      });
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-sm font-medium text-foreground">Payout schedule</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Completed cleans are held until capture, then paid out on your schedule
        via Stripe Express.
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
          disabled={opening}
          onClick={() => void openDashboard()}
          variant="link"
        >
          {opening ? "Opening…" : "Open Stripe Express"}
        </Button>
      </div>
    </div>
  );
}
