"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CleanerActions({
  cleanerId,
  currentStatus,
  currentTier,
}: {
  cleanerId: string;
  currentStatus: string;
  currentTier: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [tier, setTier] = useState(currentTier);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasonIsValid = reason.trim().length >= 3;

  async function act(action: string) {
    if (!reasonIsValid) {
      setMessage("Add a short note first (why you’re doing this).");
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({
        action,
        reason,
        tier,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    setMessage(response.ok ? "Saved." : result.error ?? "Action failed.");
    if (response.ok) router.refresh();
  }

  const isCertified =
    currentStatus === "certified" || currentStatus === "active";

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Decide</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Check their documents, then approve them for live jobs — or hold /
        remove the account. A short note is kept for your records.
      </p>

      <Input
        className="mt-4"
        onChange={(event) => setReason(event.target.value)}
        placeholder="Note, e.g. DBS and ID checked"
        value={reason}
      />

      <div className="mt-4 grid gap-2">
        <Button
          disabled={!reasonIsValid || busy || isCertified}
          onClick={() => void act("approve")}
        >
          {isCertified ? "Already approved" : "Approve for live jobs"}
        </Button>
        <Button
          disabled={!reasonIsValid || busy}
          onClick={() => void act("reject")}
          variant="outline"
        >
          Keep on hold
        </Button>
        <Button
          disabled={!reasonIsValid || busy}
          onClick={() => void act("suspend")}
          variant="outline"
        >
          Suspend temporarily
        </Button>
        <Button
          disabled={!reasonIsValid || busy}
          onClick={() => void act("remove")}
          variant="destructive"
        >
          Ban from platform
        </Button>
      </div>

      <div className="mt-6 border-t pt-4">
        <p className="text-sm font-medium">Tier (optional)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Only change this if you need to adjust their performance tier later.
          New approvals start on silver automatically.
        </p>
        <div className="mt-3 flex gap-2">
          <select
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            onChange={(event) => setTier(event.target.value)}
            value={tier}
          >
            {["bronze", "silver", "gold", "rose_gold", "elite"].map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button
            disabled={!reasonIsValid || busy}
            onClick={() => void act("set_tier")}
            variant="outline"
          >
            Update tier
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </section>
  );
}
