"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  async function act(action: string) {
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
    setMessage(response.ok ? "Dispute resolved." : result.error ?? "Action failed.");
    if (response.ok) router.refresh();
  }
  return <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Resolution</h2><textarea className="mt-4 min-h-24 w-full rounded-md border p-3 text-sm" onChange={(event) => setNotes(event.target.value)} placeholder="Resolution notes" /><Input className="mt-3" min={0} onChange={(event) => setAmount(event.target.value)} placeholder="Optional amount (£)" type="number" /><div className="mt-4 grid grid-cols-2 gap-2"><Button disabled={notes.length < 3} onClick={() => void act("refund")}>Issue refund</Button><Button disabled={notes.length < 3} onClick={() => void act("deduct")} variant="outline">Deduct earnings</Button><Button disabled={notes.length < 3} onClick={() => void act("resolve")} variant="outline">Resolve</Button><Button disabled={notes.length < 3} onClick={() => void act("close")} variant="ghost">Close without action</Button></div>{message ? <p className="mt-3 text-sm">{message}</p> : null}</section>;
}
