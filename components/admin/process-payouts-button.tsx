"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";

export function ProcessPayoutsButton() {
  const router = useRouter();
  const { confirm, error: showError, success } = useFeedback();
  const [working, setWorking] = useState(false);

  async function process() {
    const ok = await confirm({
      action: "Process payouts",
      description:
        "This will send all pending Stripe Connect transfers to cleaners. There’s no undo once Stripe accepts them.",
      title: "Process pending payouts?",
      variant: "default",
    });
    if (!ok) return;

    setWorking(true);
    const response = await fetch("/api/admin/payouts/process", { method: "POST" });
    const result = (await response.json()) as {
      error?: string;
      results?: { status: string }[];
    };
    setWorking(false);

    if (!response.ok) {
      showError({
        description: result.error ?? "Batch failed.",
        title: "Payouts didn’t go through",
      });
      return;
    }

    const paid =
      result.results?.filter((item) => item.status === "paid").length ?? 0;
    success({
      kind: "done",
      title: paid === 1 ? "1 payout processed" : `${paid} payouts processed`,
      note: "Cleaners should see the transfers in Stripe shortly.",
    });
    router.refresh();
  }

  return (
    <div className="w-full">
      <Button
        className="w-full sm:w-auto"
        disabled={working}
        onClick={() => void process()}
      >
        {working ? "Processing…" : "Process payouts"}
      </Button>
    </div>
  );
}
