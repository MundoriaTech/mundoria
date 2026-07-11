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
  const [tier, setTier] = useState(currentTier);
  const [message, setMessage] = useState<string | null>(null);

  async function act(action: string) {
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      body: JSON.stringify({ action, reason, tier }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Action completed." : result.error ?? "Action failed.");
    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Admin actions</h2>
      <Input
        className="mt-4"
        onChange={(event) => setReason(event.target.value)}
        placeholder="Required reason"
        value={reason}
      />
      <div className="mt-3 flex gap-2">
        <select
          className="h-10 rounded-md border px-3 text-sm"
          onChange={(event) => setTier(event.target.value)}
          value={tier}
        >
          {["bronze", "silver", "gold", "elite"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <Button disabled={reason.length < 3} onClick={() => void act("set_tier")} variant="outline">
          Change tier
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button disabled={reason.length < 3} onClick={() => void act("approve")}>
          Approve
        </Button>
        <Button disabled={reason.length < 3} onClick={() => void act("reject")} variant="outline">
          Reject
        </Button>
        <Button disabled={reason.length < 3} onClick={() => void act("suspend")} variant="outline">
          Suspend
        </Button>
        <Button disabled={reason.length < 3} onClick={() => void act("remove")} variant="destructive">
          Remove
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}
