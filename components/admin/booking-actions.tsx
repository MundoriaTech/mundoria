"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BookingActions({
  bookingId,
  cleaners,
  currentStatus,
}: {
  bookingId: string;
  cleaners: { id: string; full_name: string }[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [cleanerId, setCleanerId] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function act(action: "reassign" | "status" | "rematch") {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({ action, cleanerId: cleanerId || null, note, status }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Booking updated." : result.error ?? "Update failed.");
    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Operations controls</h2>
      <Input className="mt-4" onChange={(event) => setNote(event.target.value)} placeholder="Required audit note" />
      <div className="mt-3 flex gap-2">
        <select className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground" onChange={(event) => setCleanerId(event.target.value)}>
          <option value="">Select cleaner</option>
          {cleaners.map((cleaner) => <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>)}
        </select>
        <Button disabled={!cleanerId || note.length < 3} onClick={() => void act("reassign")} variant="outline">Reassign</Button>
      </div>
      <div className="mt-3 flex gap-2">
        <select className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground" onChange={(event) => setStatus(event.target.value)} value={status}>
          {["pending_match","matched","confirmed","cleaner_en_route","in_progress","awaiting_customer_confirmation","completed","cancelled","disputed"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <Button disabled={note.length < 3} onClick={() => void act("status")} variant="outline">Update status</Button>
      </div>
      <Button className="mt-3 w-full" disabled={note.length < 3} onClick={() => void act("rematch")} variant="destructive">
        Find Replacement
      </Button>
      {message ? (
        <p
          className={`mt-3 text-sm ${message.includes("failed") || message.includes("Cannot") || message.includes("Only") ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
