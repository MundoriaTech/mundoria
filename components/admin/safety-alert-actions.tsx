"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";

export function SafetyAlertActions({
  alertId,
  status,
}: {
  alertId: string;
  status: string;
}) {
  const router = useRouter();
  const { confirm, error: showError, success } = useFeedback();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function act(
    action:
      | "acknowledge"
      | "in_progress"
      | "resolve_continue"
      | "resolve_cancel",
  ) {
    if (action.startsWith("resolve")) {
      const ok = await confirm({
        action: action === "resolve_cancel" ? "Resolve & cancel" : "Clear hold",
        description:
          action === "resolve_cancel"
            ? "Clears the safety hold and cancels the booking."
            : "Clears the safety hold so the booking can continue.",
        title:
          action === "resolve_cancel"
            ? "Resolve and cancel booking?"
            : "Resolve and continue booking?",
        variant: action === "resolve_cancel" ? "destructive" : "default",
      });
      if (!ok) return;
    }

    setPending(true);
    const response = await fetch(`/api/admin/safety/${alertId}`, {
      body: JSON.stringify({ action, outcomeNotes: notes }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      showError({
        description: result.error ?? "Try again.",
        title: "Couldn’t update this case",
      });
      return;
    }

    success({
      kind: "done",
      title: "Safety case updated",
      note: "Ops record saved.",
    });
    router.refresh();
  }

  const open = ["open", "acknowledged", "in_progress"].includes(status);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Triage</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Acknowledge within 15 minutes when possible. Clear the hold only after
        reviewing both parties.
      </p>
      <textarea
        className="mt-4 min-h-24 w-full rounded-md border p-3 text-sm"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Outcome notes (required to resolve)"
        value={notes}
      />
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {status === "open" ? (
          <Button
            disabled={pending}
            onClick={() => void act("acknowledge")}
            type="button"
          >
            Acknowledge
          </Button>
        ) : null}
        {["open", "acknowledged"].includes(status) ? (
          <Button
            disabled={pending}
            onClick={() => void act("in_progress")}
            type="button"
            variant="outline"
          >
            Mark in progress
          </Button>
        ) : null}
        {open ? (
          <>
            <Button
              disabled={pending || notes.trim().length < 3}
              onClick={() => void act("resolve_continue")}
              type="button"
              variant="outline"
            >
              Resolve, continue booking
            </Button>
            <Button
              disabled={pending || notes.trim().length < 3}
              onClick={() => void act("resolve_cancel")}
              type="button"
              variant="destructive"
            >
              Resolve, cancel booking
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            This case is {status}.
          </p>
        )}
      </div>
    </section>
  );
}
