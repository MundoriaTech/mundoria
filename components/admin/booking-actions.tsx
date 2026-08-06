"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
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
  const { confirm, error: showError, success } = useFeedback();
  const [cleanerId, setCleanerId] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function act(action: "reassign" | "status" | "rematch") {
    if (action === "rematch") {
      const ok = await confirm({
        action: "Find replacement",
        description:
          "This will kick off a rematch for the booking. Make sure the audit note explains why.",
        title: "Find a replacement cleaner?",
        variant: "destructive",
      });
      if (!ok) return;
    }

    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({
        action,
        cleanerId: cleanerId || null,
        note,
        status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      const errorMessage = result.error ?? "Update failed.";
      setMessage(errorMessage);
      showError({
        description: errorMessage,
        title: "Couldn’t update booking",
      });
      return;
    }

    setMessage("");
    success({
      kind: "updated",
      title:
        action === "reassign"
          ? "Cleaner reassigned"
          : action === "rematch"
            ? "Rematch started"
            : "Booking updated",
      note: "The change is in the audit trail.",
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Operations controls</h2>
      <Input
        className="mt-4"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Required audit note"
      />
      <div className="mt-3 flex gap-2">
        <select
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          onChange={(event) => setCleanerId(event.target.value)}
        >
          <option value="">Select cleaner</option>
          {cleaners.map((cleaner) => (
            <option key={cleaner.id} value={cleaner.id}>
              {cleaner.full_name}
            </option>
          ))}
        </select>
        <Button
          disabled={!cleanerId || note.length < 3}
          onClick={() => void act("reassign")}
          variant="outline"
        >
          Reassign
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <select
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          {[
            "pending_match",
            "matched",
            "confirmed",
            "cleaner_en_route",
            "in_progress",
            "awaiting_customer_confirmation",
            "completed",
            "cancelled",
            "disputed",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <Button
          disabled={note.length < 3}
          onClick={() => void act("status")}
          variant="outline"
        >
          Update status
        </Button>
      </div>
      <Button
        className="mt-3 w-full"
        disabled={note.length < 3}
        onClick={() => void act("rematch")}
        variant="destructive"
      >
        Find Replacement
      </Button>
      {message ? (
        <p className="mt-3 text-sm text-destructive">{message}</p>
      ) : null}
    </section>
  );
}
