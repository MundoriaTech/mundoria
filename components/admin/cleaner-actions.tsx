"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CleanerActions({
  cleanerId,
  currentTier,
}: {
  cleanerId: string;
  currentTier: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [certificationScore, setCertificationScore] = useState("75");
  const [tier, setTier] = useState(currentTier);
  const [message, setMessage] = useState<string | null>(null);
  const reasonIsValid = reason.trim().length >= 3;

  async function act(action: string) {
    if (!reasonIsValid) {
      setMessage("Add a short admin reason before running this action.");
      return;
    }
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({
        action,
        certificationScore: certificationScore
          ? Number(certificationScore)
          : undefined,
        reason,
        tier,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Action completed." : result.error ?? "Action failed.");
    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Admin actions</h2>
      <Input
        className="mt-4"
        onChange={(event) => setReason(event.target.value)}
        placeholder="Required admin reason, e.g. DBS and ID verified"
        value={reason}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        A reason is required for the audit log and cleaner history.
      </p>
      <Input
        className="mt-3"
        max={100}
        min={0}
        onChange={(event) => setCertificationScore(event.target.value)}
        placeholder="Certification score"
        type="number"
        value={certificationScore}
      />
      <div className="mt-3 flex gap-2">
        <select
          className="h-10 rounded-md border px-3 text-sm"
          onChange={(event) => setTier(event.target.value)}
          value={tier}
        >
          {["bronze", "silver", "gold", "rose_gold", "elite"].map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button disabled={!reasonIsValid} onClick={() => void act("set_tier")} variant="outline">
          Change tier
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button disabled={!reasonIsValid} onClick={() => void act("approve")}>
          Approve & activate
        </Button>
        <Button disabled={!reasonIsValid} onClick={() => void act("reject")} variant="outline">
          Needs training
        </Button>
        <Button disabled={!reasonIsValid} onClick={() => void act("start_training")} variant="outline">
          Start training
        </Button>
        <Button disabled={!reasonIsValid} onClick={() => void act("suspend")} variant="outline">
          Suspend
        </Button>
        <Button disabled={!reasonIsValid} onClick={() => void act("remove")} variant="destructive">
          Remove
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}
