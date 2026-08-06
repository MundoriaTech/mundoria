"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RematchButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function rematch() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({
        action: "rematch",
        note: "One-click replacement requested from operations monitor",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Rematch failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={busy}
        onClick={() => void rematch()}
        size="sm"
        variant="destructive"
      >
        {busy ? "Matching…" : "Find Replacement"}
      </Button>
      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
