"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const { confirm, error: showError, success } = useFeedback();
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");

  async function act(action: string) {
    const needsConfirm = ["refund", "deduct", "close"].includes(action);
    if (needsConfirm) {
      const labels: Record<string, { action: string; title: string; description: string }> = {
        refund: {
          action: "Issue refund",
          description: "This will refund the customer. Double-check the amount and notes.",
          title: "Issue a refund?",
        },
        deduct: {
          action: "Deduct earnings",
          description: "This reduces the cleaner’s payout for this job.",
          title: "Deduct cleaner earnings?",
        },
        close: {
          action: "Close dispute",
          description: "Close without further action. This can’t be easily undone.",
          title: "Close without action?",
        },
      };
      const copy = labels[action]!;
      const ok = await confirm({
        action: copy.action,
        description: copy.description,
        title: copy.title,
        variant: action === "close" ? "outline" : "destructive",
      });
      if (!ok) return;
    }

    const response = await fetch(`/api/admin/disputes/${disputeId}`, {
      body: JSON.stringify({
        action,
        amount: amount ? Math.round(Number(amount) * 100) : undefined,
        notes,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      showError({
        description: result.error ?? "Action failed.",
        title: "Couldn’t resolve dispute",
      });
      return;
    }

    success({
      kind: "done",
      title: "Dispute updated",
      note: "Resolution is on the record.",
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Resolution</h2>
      <textarea
        className="mt-4 min-h-24 w-full rounded-md border p-3 text-sm"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Resolution notes"
      />
      <Input
        className="mt-3"
        min={0}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Optional amount (£)"
        type="number"
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          disabled={notes.length < 3}
          onClick={() => void act("uphold_rating")}
          variant="outline"
        >
          Uphold rating dispute
        </Button>
        <Button
          disabled={notes.length < 3}
          onClick={() => void act("reject_rating")}
          variant="outline"
        >
          Reject rating dispute
        </Button>
        <Button disabled={notes.length < 3} onClick={() => void act("refund")}>
          Issue refund
        </Button>
        <Button
          disabled={notes.length < 3}
          onClick={() => void act("deduct")}
          variant="outline"
        >
          Deduct earnings
        </Button>
        <Button
          disabled={notes.length < 3}
          onClick={() => void act("resolve")}
          variant="outline"
        >
          Resolve
        </Button>
        <Button
          disabled={notes.length < 3}
          onClick={() => void act("close")}
          variant="ghost"
        >
          Close without action
        </Button>
      </div>
    </section>
  );
}
